import './symbol';

import {
  TypedArray,
  TypedArrayConstructor,
  DynamicTypedArrayOptions,
  GrowthPolicy,
  Allocator,
  Deallocator,
  Reallocator
} from './types';

import {
  defaultAllocator,
  defaultDeallocator,
  defaultReallocator,
  defaultGrowthPolicy
} from './defaults';

import { 
  ArrayIterator, 
  isTypedArrayConstructor,
  isFunction,
  isNumber, 
  isArrayLike,
  isIterable 
} from './utils'; 


export default class DynamicTypedArray<T extends TypedArray> {

  private _array: T;
  private _length: number;
  private _constructor: TypedArrayConstructor<T>;
  private _growthPolicy: GrowthPolicy;
  private _allocator: Allocator;
  private _deallocator: Deallocator;
  private _reallocator: Reallocator;
  
  constructor(constructor: TypedArrayConstructor<T> = Float64Array as any, init: number | ArrayLike<number> | Iterable<number> = 0, {
    growthPolicy = defaultGrowthPolicy, 
    allocator = defaultAllocator, 
    deallocator = defaultDeallocator,
    reallocator = defaultReallocator
  }: DynamicTypedArrayOptions = {}) {        
    if (!isTypedArrayConstructor<T>(constructor)) {
      throw new TypeError(`The constructor must be a typed array constructor function!`);
    }

    if (!isFunction(growthPolicy)) {
      throw new TypeError(`The growthPolicy must be a function!`);
    }
    
    if (!isFunction(allocator)) {
      throw new TypeError(`The allocator must be a function!`);
    }
    
    if (!isFunction(deallocator)) {
      throw new TypeError(`The deallocator must be a function!`);
    }
    
    if (!isFunction(reallocator)) {
      throw new TypeError(`The reallocator must be a function!`);
    }

    this._array = undefined;
    this._length = 0;
    this._constructor = constructor;
    this._growthPolicy = growthPolicy;
    this._allocator = allocator;
    this._deallocator = deallocator;
    this._reallocator = reallocator;
    
    if (isNumber(init)) {
      if (init < 0) {
        throw new RangeError(`The initial size must not be negative!`);
      }
      this._ensureCapacity(init);
      this._length = init;
    } else if (isArrayLike<number>(init)) {
      const { length } = init;
      this._ensureCapacity(length);
      this._length = length;
      for (let i = 0; i < length; ++i) {
        this._array[i] = init[i];
      }
    } else if (isIterable<number>(init)) {
      for (let value of init) {
        this.push(value);
      }
    } else {
      throw new TypeError(`The initilizer must be a number or an iterable object.`);
    }
  }
  
  size() {
    return this._length;
  }
  
  capacity() {
    return this._array.length;
  }

  get(index: number): number {
    if (index < this._length) {
      return this._array[index];
    }
  }

  set(index: number, value: number) {
    if (index < this._length) {
      this._array[index] = value;
    }
  }

  push(...values: number[]): void;
  push() {
    const { length } = arguments;
    this._ensureCapacity(this._length + length);
    for (let i = 0; i < length; ++i) {
      this._array[this._length++] = arguments[i];
    }
  }

  pop(): number {
    return (this._length <= 0) ? undefined : this._array[--this._length]; 
  }

  forEach(callback: (value: number, index: number) => void, thisArg?: any) {
    const length = this._length;
    for (let i = 0; i < length; ++i) {
      callback.call(thisArg, this._array[i], i);
    }
  }
  
  [Symbol.iterator](): Iterator<number> {
    return new ArrayIterator<number>(this._array, 0, this._length);
  }
  
  toArray(): number[] {
    return Array.prototype.slice.call(this._array, 0, this._length);
  }
  
  toJSON(): number[] {
    return this.toArray();
  }
  
  toString() {
    return this.toArray().toString();
  }
  
  private _ensureCapacity(minCapacity: number) {
    if (!this._array || minCapacity > this.capacity()) {
      const newCapacity = this._growthPolicy(minCapacity);
      if ((newCapacity | 0) !== newCapacity ) {
        throw new TypeError(`The computed new capacity (${newCapacity}) is not an integer value.`);
      } else if (newCapacity < minCapacity) {
        throw new RangeError(`The computed new capacity (${newCapacity}) is smaller than the requested minimum capacity (${minCapacity})`);
      }
      this._resize(newCapacity);
    }
  }
  
  private _resize(capacity: number) {
    if (capacity < 0) {
      throw new RangeError(`The requested capacity must not be negative`);
    }
    
    const byteLength = this._constructor.BYTES_PER_ELEMENT * capacity;
    
    let buffer = (this._array === undefined) 
      ? this._allocator(byteLength) 
      : this._reallocator(this._array.buffer, byteLength, this._allocator, this._deallocator);
    
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError(`The reallocator must return an ArrayBuffer!`);
    }
    
    if (buffer.byteLength < byteLength) {
      throw new RangeError(`The allocated buffer is too small!`);
    }

    this._array = new this._constructor(buffer, 0, capacity);
    
    if (capacity < this._length) {
      this._length = capacity;
    }
  }
}
