export default async function evaluateProgram() {
  const you = this.program.number;

  /* eslint-disable no-unused-vars*/
  let Claim = this.getClaimTagFunction({ source: you, isDynamic: false });
  let Wish = this.getWishTagFunction({ source: you, isDynamic: false });
  let When = this.getWhenTagFunction({
    source: you,
    isDynamic: false,
    groupMatches: false,
  });
  let WithAll = this.getWhenTagFunction({
    source: you,
    isDynamic: false,
    groupMatches: true,
  });
  /* eslint-enable no-unused-vars*/

  const userCode =
    this.program.currentCode || (await fetch(this.program.currentCodeUrl).then(res => res.text()));

  // validate code first
  try {
    this.acorn.parse(userCode);
  } catch (err) {
    this.reportErrorMessage({
      isDynamic: false,
      source: you,
      message: err.message,
      lineNumber: err.loc.line,
      columnNumber: err.loc.column,
    });
    return;
  }

  // run code and catch errors
  try {
    const fullCode = [userCode, `//@ sourceURL=${this.program.currentCodeUrl}`].join('\n') + '\n';
    eval(fullCode);
  } catch (error) {
    this.reportError({ error, source: you, isDynamic: false });
  }

  Claim = this.getClaimTagFunction({ source: you, isDynamic: true });
  Wish = this.getWishTagFunction({ source: you, isDynamic: true });
  When = this.getWhenTagFunction({
    source: you,
    isDynamic: true,
    groupMatches: true,
  });
  WithAll = this.getWhenTagFunction({
    source: you,
    isDynamic: true,
    groupMatches: true,
  });
}
