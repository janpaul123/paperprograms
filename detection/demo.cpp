#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <opencv2/opencv.hpp>

cv::Scalar keyPointToColor(cv::KeyPoint &keyPoint, cv::Mat &video) {
  cv::Rect boundingRect(keyPoint.pt.x - keyPoint.size/2, keyPoint.pt.y - keyPoint.size/2, keyPoint.size, keyPoint.size);
  cv::Mat circleROI(video, boundingRect);
  cv::Mat circleROILab;
  cv::cvtColor(circleROI, circleROILab, CV_BGR2Lab);

  cv::Mat circleMask(keyPoint.size, keyPoint.size, CV_8UC1, cv::Scalar(0, 0, 0));
  circle(circleMask, cv::Point(keyPoint.size / 2, keyPoint.size / 2), keyPoint.size / 2 - 1, cv::Scalar(255, 255, 255), -1);

  return mean(circleROILab, circleMask);
}

int colorIndexForColor(cv::Scalar &color, std::vector<cv::Scalar> &colors) {
  int foundDistanceSq = -1;
  int foundIndex = -1;
  for (int i=0; i<colors.size(); i++) {
    int distanceSq = (colors[i][1] - color[1]) * (colors[i][1] - color[1]) +
      (colors[i][2] - color[2]) * (colors[i][2] - color[2]);
    if (foundDistanceSq == -1 || distanceSq < foundDistanceSq) {
      foundDistanceSq = distanceSq;
      foundIndex = i;
    }
  }
  return foundIndex;
}

int shapeToId(std::vector<int> &shape, std::vector<cv::KeyPoint> &keypoints) {
  return 125 * keypoints[shape[0]].octave
    + 25 * keypoints[shape[1]].octave
    + 5 * keypoints[shape[3]].octave
    + keypoints[shape[4]].octave;
}

int shapeToCornerNum(std::vector<int> &shape, std::vector<cv::KeyPoint> &keypoints) {
  return keypoints[shape[2]].octave;
}

int main(int argc, char **argv) {
  cv::VideoCapture videoCapture(0);

  namedWindow("window", cv::WINDOW_AUTOSIZE);
  cv::Mat video, displayLab, displayBgr;

  std::vector<cv::Scalar> colors = {
    cv::Scalar(73.3469, 160.347, 156.612),
    cv::Scalar(125.816, 139.673, 174.429),
    cv::Scalar(106.543, 114.926, 157.901),
    cv::Scalar(84.4321, 123.099, 124.062),
    cv::Scalar(57.9753, 153.63, 137.012)
  };
  std::vector<std::string> colorNames = {"red", "orange", "green", "blue", "purple"};
  std::vector<std::string> cornerNames = {"TL", "TR", "BR", "BL"};

  std::map<int, std::vector<cv::Point>> pointsById;
  cv::Point nullPoint;

  while (true) {
    videoCapture.read(video);
    cv::cvtColor(video, displayLab, CV_BGR2Lab);

    for (int i=0; i<colors.size(); i++) {
      circle(displayLab, cv::Point(30 * (i+1), 30), 10, colors[i], -1);
    }

    cv::SimpleBlobDetector::Params params;
    params.filterByCircularity = true;
    params.minCircularity = 0.85;
    params.filterByConvexity = true;
    params.minConvexity = 0.85;
    params.minThreshold = 0;
    params.thresholdStep = 5;
    params.minRepeatability = 3;

    cv::Ptr<cv::SimpleBlobDetector> detector = cv::SimpleBlobDetector::create(params);
    std::vector<cv::KeyPoint> keypoints;
    detector->detect(video, keypoints);

    // Sort by x position. We rely on this when scanning through the circles
    // to find connected components, and when calibrating.
    std::sort(keypoints.begin(), keypoints.end(), [](cv::KeyPoint & a, cv::KeyPoint & b) -> bool {
        return a.pt.x < b.pt.x;
    });

    for (auto &keyPoint : keypoints) {
      cv::Scalar color = keyPointToColor(keyPoint, video);
      circle(displayLab, keyPoint.pt, keyPoint.size/2 + 3, color);

      int colorIndex = colorIndexForColor(color, colors);
      keyPoint.octave = colorIndex; // Misuse octave for this. :)
    }

    // Build connected components.
    std::vector<std::set<int>> neighborIndexes(keypoints.size());
    for (int i=0; i<keypoints.size(); i++) {
      for (int j=i+1; j<keypoints.size(); j++) {
        if (keypoints[j].pt.x - keypoints[i].pt.x > keypoints[i].size * 3) break;

        if (cv::norm(keypoints[i].pt - keypoints[j].pt) < (keypoints[i].size + keypoints[j].size) * 0.8) {
          neighborIndexes[i].insert(j);
          neighborIndexes[j].insert(i);
          line(displayLab, keypoints[i].pt, keypoints[j].pt, colors[0]);
        }
      }
    }

    // Find acyclical shapes of 5.
    std::set<int> seenIndexes;
    std::set<int> seenIds;
    for (int i=0; i<keypoints.size(); i++) {
      if (neighborIndexes[i].size() == 1 && seenIndexes.count(i) == 0) {
        int index = i;
        std::vector<int> shape;
        while (index > -1) {
          shape.push_back(index);
          seenIndexes.insert(index);

          int newIndex = -1;
          for (int potentialNewIndex : neighborIndexes[index]) {
            if (seenIndexes.count(potentialNewIndex) == 0) {
              newIndex = potentialNewIndex;
              break;
            }
          }
          index = newIndex;
        }
        if (shape.size() == 5) {
          // Reverse the array if it's the wrong way around.
          double mag = (keypoints[shape[0]].pt-keypoints[shape[2]].pt)
            .cross(keypoints[shape[4]].pt-keypoints[shape[2]].pt);
          if (mag > 100) { // Use 100 to avoid straight line. We already depend on sorting by x for that.
            std::reverse(std::begin(shape), std::end(shape));
          }

          int id = shapeToId(shape, keypoints);
          int cornerNum = shapeToCornerNum(shape, keypoints);

          seenIds.insert(id);
          if (pointsById.count(id) == 0) pointsById[id] = std::vector<cv::Point>(4);
          pointsById[id][cornerNum] = keypoints[shape[2]].pt;
          putText(displayLab, std::to_string(id) + "," + cornerNames[cornerNum], (keypoints[shape[0]].pt + keypoints[shape[4]].pt) / 2, CV_FONT_HERSHEY_DUPLEX, 0.3, cv::Scalar(255, 0, 0));
        }
      }
    }

    std::vector<int> idsToErase;
    for (auto const& entry : pointsById) {
      if (seenIds.count(entry.first) == 0) {
        idsToErase.push_back(entry.first);
      } else if (entry.second[0] != nullPoint && entry.second[1] != nullPoint &&
          entry.second[2] != nullPoint && entry.second[3] != nullPoint) {

        line(displayLab, entry.second[0], entry.second[1], cv::Scalar(255, 0, 0));
        arrowedLine(displayLab, entry.second[2], entry.second[1], cv::Scalar(255, 0, 0));
        line(displayLab, entry.second[2], entry.second[3], cv::Scalar(255, 0, 0));
        arrowedLine(displayLab, entry.second[3], entry.second[0], cv::Scalar(255, 0, 0));
        arrowedLine(displayLab, (entry.second[2] + entry.second[3]) / 2,
          (entry.second[0] + entry.second[1]) / 2, cv::Scalar(255, 0, 0));
      }
    }
    for (auto id : idsToErase) {
      pointsById.erase(id);
    }

    // cv::Mat im_with_keypoints;
    // drawKeypoints(video, keypoints, im_with_keypoints, cv::Scalar(0,0,255), cv::DrawMatchesFlags::DRAW_RICH_KEYPOINTS);
    // imshow("window", im_with_keypoints);

    cv::cvtColor(displayLab, displayBgr, CV_Lab2BGR);
    imshow("window", displayBgr);

    char key = cv::waitKey(1);
    if (key == 'c') {
      if (keypoints.size() != 5) {
        std::cout << "Did not find calibration page with exactly 5 circles." << std::endl;
        std::cout << "Instead found " << keypoints.size() << " circles." << std::endl;
      } else {
        std::cout << "Detecting keypoints..." << std::endl;
        for (int i=0; i<keypoints.size(); i++) {
          colors[i] = keyPointToColor(keypoints[i], video);
          std::cout << colors[i] << std::endl;
        }
      }
    } else if (key >= 0) break;
  }

  videoCapture.release();
  return 0;
}
