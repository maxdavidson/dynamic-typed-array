import { GrowthPolicy, Allocator, Deallocator, Reallocator } from './types';


// The default growth policy grows the buffer by 1.5x the requested capacity.
export const defaultGrowthPolicy: GrowthPolicy = minCapacity => 3 * minCapacity >>> 1;

// The default allocator simply creates a new array buffer.
export const defaultAllocator: Allocator = byteLength => new ArrayBuffer(byteLength);

// The default dealloctor does nothing.
export const defaultDeallocator: Deallocator = buffer => {}; 

// The default reallocator uses the ArrayBuffer::transfer function, if it is available.
// Otherwise it simply allocates a new buffer and copies the old data over.
export const defaultReallocator: Reallocator = ArrayBuffer['transfer'] || function defaultReallocator(oldBuffer, newByteLength, allocator, deallocator) {
  const newBuffer = allocator(newByteLength);
  
  // Copy data over to the new buffer
  let oldView = new Uint8Array(oldBuffer);
  const newView = new Uint8Array(newBuffer);
  
  if (newView.length <= oldView.length) {
    oldView = oldView.subarray(0, newView.length);
  }
  
  newView.set(oldView);
  
  deallocator(oldBuffer);
  return newBuffer;
};
