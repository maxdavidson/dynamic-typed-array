// Tiny string-based Symbol polyfill
/* istanbul ignore next */
if (typeof Symbol !== 'function') {
  const _symbol: any = function Symbol() {
    return Math.random().toString(16).slice(2);
  };
  
  _symbol.for = (key: string) => key;
  _symbol.iterator = '@@iterator';
  
  const global = Function('return this')();
  Object.defineProperty(global, 'Symbol', { value: _symbol });
}
