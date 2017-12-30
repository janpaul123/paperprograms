#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <ctime>
#include <opencv2/opencv.hpp>
#include "json.hpp"
using json = nlohmann::json;

// Based on https://stackoverflow.com/a/43236846
cv::Scalar convertScalarColor(cv::Scalar color, int code) {
  cv::Mat after;
  cv::Mat before(1, 1, CV_8UC3, color);
  cv::cvtColor(before, after, code);
  return cv::Scalar(after.data[0], after.data[1], after.data[2]);
}

cv::Scalar keyPointToColorLab(cv::KeyPoint &keyPoint, cv::Mat &video) {
  cv::Rect boundingRect(keyPoint.pt.x - keyPoint.size/2, keyPoint.pt.y - keyPoint.size/2, keyPoint.size, keyPoint.size);
  cv::Mat circleROI(video, boundingRect);
  cv::Mat circleROILab;
  cv::cvtColor(circleROI, circleROILab, CV_BGR2Lab);

  cv::Mat circleMask(keyPoint.size, keyPoint.size, CV_8UC1, cv::Scalar(0, 0, 0));
  circle(circleMask, cv::Point(keyPoint.size / 2, keyPoint.size / 2), keyPoint.size / 2 - 1, cv::Scalar(255, 255, 255), -1);

  return mean(circleROILab, circleMask);
}

int colorIndexForColor(cv::Scalar color, std::vector<cv::Scalar> &colors) {
  double foundDistance = -1;
  int foundIndex = -1;
  for (int i=0; i<colors.size(); i++) {
    double distance = cv::norm(colors[i] - color);
    if (foundDistance == -1 || distance < foundDistance) {
      foundDistance = distance;
      foundIndex = i;
    }
  }
  return foundIndex;
}

int shapeToId(std::vector<int> &shape, std::vector<cv::KeyPoint> &keyPoints) {
  return 125 * keyPoints[shape[0]].octave
    + 25 * keyPoints[shape[1]].octave
    + 5 * keyPoints[shape[3]].octave
    + keyPoints[shape[4]].octave;
}

int shapeToCornerNum(std::vector<int> &shape, std::vector<cv::KeyPoint> &keyPoints) {
  if (keyPoints[shape[2]].octave < 0 || keyPoints[shape[2]].octave > 3) return -1;
  return keyPoints[shape[2]].octave;
}

// http://www.smallbulb.net/2013/351-opencv-convert-projection-matrix-to-maps
void perspective_to_maps(const cv::Mat &perspective_mat, const cv::Size &img_size,
                          cv::Mat &map1, cv::Mat &map2)
{
  // invert the matrix because the transformation maps must be
  // bird's view -> original
  cv::Mat inv_perspective(perspective_mat.inv());
  inv_perspective.convertTo(inv_perspective, CV_32FC1);

  // create XY 2D array
  // (((0, 0), (1, 0), (2, 0), ...),
  //  ((0, 1), (1, 1), (2, 1), ...),
  // ...)
  cv::Mat xy(img_size, CV_32FC2);
  float *pxy = (float*)xy.data;
  for (int y = 0; y < img_size.height; y++)
    for (int x = 0; x < img_size.width; x++)
    {
      *pxy++ = x;
      *pxy++ = y;
    }

  // perspective transformation of the points
  cv::Mat xy_transformed;
  cv::perspectiveTransform(xy, xy_transformed, inv_perspective);

  // split x/y to extra maps
  assert(xy_transformed.channels() == 2);
  cv::Mat maps[2]; // map_x, map_y
  cv::split(xy_transformed, maps);

  // remap() with integer maps is faster
  cv::convertMaps(maps[0], maps[1], map1, map2, CV_16SC2);
}

// Global stuff.
cv::VideoCapture videoCapture;
cv::Point2f warpPoints[4];
std::vector<cv::Scalar> colorsBGR(5);

cv::Rect wrapROI;
cv::Mat perspectiveMat1, perspectiveMat2;
std::vector<cv::Scalar> colorsLab(5);

void resetDerivedInfo() {
  // wrapROI
  cv::Point min(warpPoints[0]);
  cv::Point max(warpPoints[0]);
  for (int i=1; i<4; i++) {
    if (warpPoints[i].x < min.x) min.x = warpPoints[i].x;
    if (warpPoints[i].y < min.y) min.y = warpPoints[i].y;
    if (warpPoints[i].x > max.x) max.x = warpPoints[i].x;
    if (warpPoints[i].y > max.y) max.y = warpPoints[i].y;
  }
  wrapROI = cv::Rect(min, max);
  std::cout << wrapROI << std::endl;

  // perspectiveMat1, perspectiveMat2
  int width = videoCapture.get(cv::CAP_PROP_FRAME_WIDTH);
  int height = videoCapture.get(cv::CAP_PROP_FRAME_HEIGHT);
  cv::Point2f warpPointsOutput[] = {
    cv::Point2f(0, 0),
    cv::Point2f(width, 0),
    cv::Point2f(width, height),
    cv::Point2f(0, height)
  };
  cv::Mat M = cv::getPerspectiveTransform(warpPoints, warpPointsOutput);
  perspective_to_maps(M, cv::Size(width, height), perspectiveMat1, perspectiveMat2);

  // colorsLab
  for (int i=0; i<colorsBGR.size(); i++) {
    colorsLab[i] = convertScalarColor(colorsBGR[i], CV_BGR2Lab);
  }
}

void saveJson() {
  json j;
  for (int i=0; i<4; i++) {
    j["warpPoints"][i]["x"] = warpPoints[i].x;
    j["warpPoints"][i]["y"] = warpPoints[i].y;
  }

  for (int i=0; i<colorsBGR.size(); i++) {
    j["colorsBGR"][i][0] = colorsBGR[i][0];
    j["colorsBGR"][i][1] = colorsBGR[i][1];
    j["colorsBGR"][i][2] = colorsBGR[i][2];
  }

  std::ofstream out("config.json");
  out << j << std::endl;
  out.close();
}

void loadJson() {
  json j;
  std::ifstream in("config.json");
  if (in.good()) {
    in >> j;
    in.close();
  }

  if (j["warpPoints"].is_array()) {
    for (int i=0; i<4; i++) {
      warpPoints[i] = cv::Point2f(j["warpPoints"][i]["x"], j["warpPoints"][i]["y"]);
    }
  } else {
    for (int i=0; i<4; i++) {
      warpPoints[i] = cv::Point2f(0, 0);
    }
  }

  if (j["colorsBGR"].is_array()) {
    for (int i=0; i<j["colorsBGR"].size(); i++) {
      colorsBGR[i] = cv::Scalar(j["colorsBGR"][i][0], j["colorsBGR"][i][1], j["colorsBGR"][i][2]);
    }
  } else {
    colorsBGR[0] = cv::Scalar(24, 43, 119);
    colorsBGR[1] = cv::Scalar(35, 108, 155);
    colorsBGR[2] = cv::Scalar(48, 104, 94);
    colorsBGR[3] = cv::Scalar(84, 80, 65);
    colorsBGR[4] = cv::Scalar(42, 36, 92);
  }
  saveJson();
}

void onMouse(int event, int x, int y, int, void *) {
  if( event != cv::EVENT_LBUTTONDOWN ) return;

  int quadrant = x < videoCapture.get(cv::CAP_PROP_FRAME_WIDTH) / 2 ?
    (y < videoCapture.get(cv::CAP_PROP_FRAME_HEIGHT) / 2 ? 0 : 3) :
    (y < videoCapture.get(cv::CAP_PROP_FRAME_HEIGHT) / 2 ? 1 : 2);

  warpPoints[quadrant] = cv::Point2f(x, y);
  resetDerivedInfo();
  saveJson();
}


int main(int argc, char **argv) {
  loadJson();

  videoCapture = cv::VideoCapture(0);

  cv::namedWindow("window", cv::WINDOW_NORMAL);
  cv::setMouseCallback("window", onMouse);

  std::vector<std::string> colorNames = {"R", "O", "G", "B", "P"};
  std::vector<std::string> cornerNames = {"TL", "TR", "BR", "BL"};

  std::map<int, std::vector<cv::Point>> pointsById;
  cv::Point nullPoint;

  resetDerivedInfo();

  while (true) {
    clock_t startFrame = clock();

    cv::Mat videoMat;
    videoCapture.read(videoMat);

    // Warping.
    cv::Mat warpUIMat = cv::Mat::zeros(videoMat.size(), videoMat.type());
    cv::line(warpUIMat, cv::Point(0, warpUIMat.rows / 2), cv::Point(warpUIMat.cols, warpUIMat.rows / 2), cv::Scalar(128, 128, 128));
    cv::line(warpUIMat, cv::Point(warpUIMat.cols / 2, 0), cv::Point(warpUIMat.cols / 2, warpUIMat.rows), cv::Scalar(128, 128, 128));
    for (int i=0; i<4; i++) {
      cv::putText(warpUIMat, cv::format("%.0f,%.0f", warpPoints[i].x, warpPoints[i].y), warpPoints[i] - cv::Point2f(0, -20), CV_FONT_HERSHEY_DUPLEX, 0.3, cv::Scalar(0, 0, 255));
      cv::circle(warpUIMat, warpPoints[i], 10, cv::Scalar(0, 0, 255), -1);
      cv::line(warpUIMat, warpPoints[i], warpPoints[(i+1) % 4], cv::Scalar(0, 0, 255));
    }


    // cv::Mat warped = cv::Mat(videoMat.rows, videoMat.cols, videoMat.type());
    // cv::remap(videoMat, warped, perspectiveMat1, perspectiveMat2, cv::INTER_LINEAR);

    // Colorbar top left.
    cv::Mat colorBarMat = cv::Mat::zeros(videoMat.size(), videoMat.type());
    for (int i=0; i<colorsBGR.size(); i++) {
      circle(colorBarMat, cv::Point(30 * (i+1), 30), 10, colorsBGR[i], -1);
    }

    cv::SimpleBlobDetector::Params params;
    // params.filterByCircularity = true;
    // params.minCircularity = 0.85;
    // params.filterByConvexity = true;
    // params.minConvexity = 0.85;
    // params.minThreshold = 0;
    // params.thresholdStep = 5;
    // params.minRepeatability = 3;
    cv::Ptr<cv::SimpleBlobDetector> detector = cv::SimpleBlobDetector::create(params);
    std::vector<cv::KeyPoint> keyPoints;

    cv::Mat croppedVideoMat = videoMat(wrapROI);
    detector->detect(croppedVideoMat, keyPoints);
    for (auto &keyPoint : keyPoints) {
      keyPoint.pt.x += wrapROI.x;
      keyPoint.pt.y += wrapROI.y;
    }

    // Sort by x position. We rely on this when scanning through the circles
    // to find connected components, and when calibrating.
    std::sort(keyPoints.begin(), keyPoints.end(), [](cv::KeyPoint & a, cv::KeyPoint & b) -> bool {
        return a.pt.x < b.pt.x;
    });

    for (auto &keyPoint : keyPoints) {
      int colorIndex = colorIndexForColor(keyPointToColorLab(keyPoint, videoMat), colorsLab);
      keyPoint.octave = colorIndex; // Misuse octave for this. :)
    }

    // Draw circles around keyPoints
    cv::Mat keyPointCirclesMat = cv::Mat::zeros(videoMat.size(), videoMat.type());
    for (auto &keyPoint : keyPoints) {
      circle(keyPointCirclesMat, keyPoint.pt, keyPoint.size/2 + 3, colorsBGR[keyPoint.octave]);
    }

    // Draw letter within keyPoints
    cv::Mat keyPointLettersMat = cv::Mat::zeros(videoMat.size(), videoMat.type());
    for (auto &keyPoint : keyPoints) {
      cv::putText(keyPointLettersMat, colorNames[keyPoint.octave], keyPoint.pt + cv::Point2f(-6, 6), CV_FONT_HERSHEY_DUPLEX, 0.6, cv::Scalar(255, 255, 255));
    }

    // Build connected components.
    cv::Mat componentsMat = cv::Mat::zeros(videoMat.size(), videoMat.type());
    std::vector<std::set<int>> neighborIndexes(keyPoints.size());
    for (int i=0; i<keyPoints.size(); i++) {
      for (int j=i+1; j<keyPoints.size(); j++) {
        if (keyPoints[j].pt.x - keyPoints[i].pt.x > keyPoints[i].size * 3) break;

        if (cv::norm(keyPoints[i].pt - keyPoints[j].pt) < (keyPoints[i].size + keyPoints[j].size) * 0.8) {
          neighborIndexes[i].insert(j);
          neighborIndexes[j].insert(i);
          line(componentsMat, keyPoints[i].pt, keyPoints[j].pt, cv::Scalar(255, 255, 255));
        }
      }
    }

    // Find acyclical shapes of 5.
    // std::set<int> seenIndexes;
    // std::set<int> seenIds;
    // for (int i=0; i<keyPoints.size(); i++) {
    //   if (neighborIndexes[i].size() == 1 && seenIndexes.count(i) == 0) {
    //     int index = i;
    //     std::vector<int> shape;
    //     while (index > -1) {
    //       shape.push_back(index);
    //       seenIndexes.insert(index);

    //       int newIndex = -1;
    //       for (int potentialNewIndex : neighborIndexes[index]) {
    //         if (seenIndexes.count(potentialNewIndex) == 0) {
    //           newIndex = potentialNewIndex;
    //           break;
    //         }
    //       }
    //       index = newIndex;
    //     }
    //     if (shape.size() == 5) {
    //       // Reverse the array if it's the wrong way around.
    //       double mag = (keyPoints[shape[0]].pt-keyPoints[shape[2]].pt)
    //         .cross(keyPoints[shape[4]].pt-keyPoints[shape[2]].pt);
    //       if (mag > 100) { // Use 100 to avoid straight line. We already depend on sorting by x for that.
    //         std::reverse(std::begin(shape), std::end(shape));
    //       }

    //       int id = shapeToId(shape, keyPoints);
    //       int cornerNum = shapeToCornerNum(shape, keyPoints);

    //       if (cornerNum > -1) {
    //         seenIds.insert(id);
    //         if (pointsById.count(id) == 0) pointsById[id] = std::vector<cv::Point>(4);
    //         pointsById[id][cornerNum] = keyPoints[shape[2]].pt;
    //         putText(warped, std::to_string(id) + "," + cornerNames[cornerNum], (keyPoints[shape[0]].pt + keyPoints[shape[4]].pt) / 2, CV_FONT_HERSHEY_DUPLEX, 0.3, cv::Scalar(255, 0, 0));
    //       }
    //     }
    //   }
    // }

    // std::vector<int> idsToErase;
    // for (auto &entry : pointsById) {
    //   if (seenIds.count(entry.first) == 0) {
    //     idsToErase.push_back(entry.first);
    //   } else if (entry.second[0] != nullPoint && entry.second[1] != nullPoint &&
    //       entry.second[2] != nullPoint && entry.second[3] != nullPoint) {

    //     line(warped, entry.second[0], entry.second[1], cv::Scalar(255, 0, 0));
    //     arrowedLine(warped, entry.second[2], entry.second[1], cv::Scalar(255, 0, 0));
    //     line(warped, entry.second[2], entry.second[3], cv::Scalar(255, 0, 0));
    //     arrowedLine(warped, entry.second[3], entry.second[0], cv::Scalar(255, 0, 0));
    //     arrowedLine(warped, (entry.second[2] + entry.second[3]) / 2,
    //       (entry.second[0] + entry.second[1]) / 2, cv::Scalar(255, 0, 0));
    //   }
    // }
    // for (auto id : idsToErase) {
    //   pointsById.erase(id);
    // }

    // cv::Mat im_with_keyPoints;
    // drawKeypoints(video, keyPoints, im_with_keyPoints, cv::Scalar(0,0,255), cv::DrawMatchesFlags::DRAW_RICH_KEYPOINTS);
    // imshow("window", im_with_keyPoints);

    cv::Mat windowMat = videoMat + warpUIMat + colorBarMat + keyPointCirclesMat + keyPointLettersMat;
    // cv::Mat resizedWindowMat = cv::Mat::zeros(cv::Size(1200, 1200 * windowMat.size().height / windowMat.size().width), windowMat.type());
    // cv::resize(windowMat, resizedWindowMat, resizedWindowMat.size());
    // imshow("window", resizedWindowMat);
    imshow("window", windowMat);

    clock_t endFrame = clock();
    std::cout << 1000000.0/(endFrame-startFrame) << std::endl;

    char key = cv::waitKey(1);
    if (key == 'c') {
      if (keyPoints.size() != 5) {
        std::cout << "Did not find calibration page with exactly 5 circles." << std::endl;
        std::cout << "Instead found " << keyPoints.size() << " circles." << std::endl;
      } else {
        std::cout << "Detecting keyPoints..." << std::endl;
        for (int i=0; i<keyPoints.size(); i++) {
          colorsBGR[i] = convertScalarColor(keyPointToColorLab(keyPoints[i], videoMat), CV_Lab2BGR);
        }
        resetDerivedInfo();
        saveJson();
      }
    } else if (key >= 0) break;
  }

  videoCapture.release();
  return 0;
}
