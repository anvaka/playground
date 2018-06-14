module.exports = function getCorsDomain(reqHeaders) {
  const defaultDomain = 'https://anvaka.github.io';

  if (!reqHeaders || !reqHeaders.origin) return defaultDomain;

  return reqHeaders.origin.indexOf('http://localhost:8080') === 0 ? 'http://localhost:8080' : defaultDomain;
}