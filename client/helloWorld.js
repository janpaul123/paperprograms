const helloWorld = `// Hello World

importScripts('paper.js');

(async () => {
  const canvas = await paper.get('canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Hello', canvas.width / 2, canvas.height / 2 - 20);

  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('world', canvas.width / 2, canvas.height / 2);

  const number = await paper.get('number');
  ctx.fillStyle = 'rgb(100,100,255)';
  ctx.fillText(number, canvas.width / 2, canvas.height / 2 + 20);
  ctx.commit();
})();
`;
export default helloWorld;
