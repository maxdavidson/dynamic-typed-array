dynamic-typed-array
===================

[![NPM](https://img.shields.io/npm/v/dynamic-typed-array.svg)](https://www.npmjs.com/package/dynamic-typed-array)
[![Build Status](https://img.shields.io/travis/maxdavidson/dynamic-typed-array/master.svg)](https://travis-ci.org/maxdavidson/dynamic-typed-array)
[![Coverage Status](https://img.shields.io/coveralls/maxdavidson/dynamic-typed-array/master.svg)](https://coveralls.io/github/maxdavidson/dynamic-typed-array?branch=master)
[![Dependency Status](https://img.shields.io/david/maxdavidson/dynamic-typed-array.svg)](https://david-dm.org/maxdavidson/dynamic-typed-array)
[![devDependency Status](https://img.shields.io/david/dev/maxdavidson/dynamic-typed-array.svg)](https://david-dm.org/maxdavidson/dynamic-typed-array#info=devDependencies)

https://en.wikipedia.org/wiki/Dynamic_array

### API:
```typescript
class DynamicTypedArray<T extends TypedArray> {
  constructor(constructor: TypedArrayConstructor<T> = Float64Array,
              init: number | ArrayLike<number> | Iterable<number> = 0, 
              options: DynamicTypedArrayOptions = {});
  
  size(): number;
  capacity(): number;
  
  get(index: number): number;
  set(index: number, value: number): void;
  
  push(...values: number[]): void;
  pop(): number;
  
  forEach(callback: (value: number, index: number) => void, thisArg?: any): void;
  
  [Symbol.iterator](): IterableIterator<number>;
  
  toArray(): number[];
  toJSON(): number[];
  toString(): string;
}

type TypedArray = ArrayBufferView & ArrayLike<number>;
  
type TypedArrayConstructor<T extends TypedArray> = {
  new (buffer: ArrayBuffer, byteOffset?: number, length?: number): T;
  BYTES_PER_ELEMENT: number;
}

type GrowthPolicy = (minCapacity: number) => number;
type Allocator = (minByteLength: number) => ArrayBuffer;
type Deallocator = (buffer: ArrayBuffer) => void;
type Reallocator = (oldBuffer: ArrayBuffer, newByteLength: number, 
                    allocator: Allocator, deallocator: Deallocator) => ArrayBuffer;

type DynamicTypedArrayOptions = {
  growthPolicy?: GrowthPolicy;
  allocator?: Allocator;
  deallocator?: Deallocator;
  reallocator?: Reallocator;
}
```
