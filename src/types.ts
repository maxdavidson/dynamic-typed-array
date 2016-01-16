export type GrowthPolicy = (minCapacity: number) => number;
export type Allocator = (minByteLength: number) => ArrayBuffer;
export type Deallocator = (buffer: ArrayBuffer) => void;
export type Reallocator = (oldBuffer: ArrayBuffer, newByteLength: number,
                           allocator: Allocator, deallocator: Deallocator) => ArrayBuffer;

export type TypedArray = ArrayBufferView & ArrayLike<number>;
  
export type TypedArrayConstructor<T extends TypedArray> = {
  new (buffer: ArrayBuffer, byteOffset?: number, length?: number): T;
  BYTES_PER_ELEMENT: number;
}

export type DynamicTypedArrayOptions = {
  growthPolicy?: GrowthPolicy;
  allocator?: Allocator;
  deallocator?: Deallocator;
  reallocator?: Reallocator;
}
