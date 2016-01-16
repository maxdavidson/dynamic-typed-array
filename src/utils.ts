import { TypedArray, TypedArrayConstructor } from './types'


export class ArrayIterator<T> implements Iterator<T> {
  private _array: ArrayLike<T>;
  private _start: number;
  private _end: number;
  private _result: IteratorResult<T>;
  
  constructor(array: ArrayLike<T>, start: number, end: number) {
    this._array = array;
    this._start = start;
    this._end = end;
    this._result = { value: array[start], done: false };
  }

  next(): IteratorResult<T> {
    if (this._start < this._end) {
      this._result.value = this._array[this._start++];
      this._result.done = false; 
    } else {
      this._result.value = undefined;
      this._result.done = true;
    }
    return this._result;
  }
}

export function isTypedArrayConstructor<T>(obj: any): obj is TypedArrayConstructor<T> {
  switch (obj) {
    case Int8Array: case Uint8Array: case Uint8ClampedArray: 
    case Int16Array: case Uint16Array:
    case Int32Array: case Uint32Array:
    case Float32Array: case Float64Array:
      return true;
  } 
  return false;
}

export function isNumber(obj: any): obj is number {
  return typeof obj === 'number';
}

export function isFunction(obj: any): obj is Function {
  return typeof obj === 'function';
}

export function isArrayLike<T>(obj: any): obj is ArrayLike<T> {
  return typeof obj !== 'function' && typeof obj.length === 'number'; 
} 

export function isIterable<T>(obj: any): obj is Iterable<T> {
  return Symbol.iterator in obj && typeof obj[Symbol.iterator] === 'function';
}
