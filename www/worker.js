onmessage = function(evt) {
  const canvas = evt.data.canvas;
  const ctx = canvas.getContext('2d');

  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Hello', canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('world', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = 'rgb(100,100,255)';
  ctx.fillText('!!!!!!!', canvas.width / 2, canvas.height / 2 + 20);

  ctx.commit();
};
