import assert from 'assert';
import DynamicTypedArray from '../dist-es2015/index';
//import DynamicTypedArray from '../dist/dynamic-typed-array';
//import DynamicTypedArray from '../dist/dynamic-typed-array.min';

describe('DynamicTypedArray', () => {
  const supportedConstructors = [
    Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, 
    Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array
  ];  
  
  for (let TypedArrayConstructor of supportedConstructors) {
    const constructorName = TypedArrayConstructor.name;
    
    describe(`backed by ${constructorName}`, () => {
      describe('#new()', () => {     
        it('should default to using Float64Array', () => {
          const arr = new DynamicTypedArray();
          assert(arr._array instanceof Float64Array);
        });
        
        it('should throw TypeError if the supplied constructor is not a typed array constructor', () => {
          const invalidValues = [Array, String, [], {}, () => {}, 0, 'hello', null];
          for (let invalidValue of invalidValues) { 
            assert.throws(() => new DynamicTypedArray(invalidValue), TypeError);
          }
        });
        
        it('should create a typed array of type ' + constructorName, () => {
          const arr = new DynamicTypedArray(TypedArrayConstructor);    
          assert(arr._array instanceof TypedArrayConstructor);
        });
        
        it('should default to length 0', () => {
          const arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.strictEqual(arr.size(), 0);
        });
        
        it('should be initialized to a custom size', () => {
          const lengths = [5, 54, 95, 2, 6, 4, 23, 0, 5];
          for (let length of lengths) {
            const arr = new DynamicTypedArray(TypedArrayConstructor, length);
            assert.strictEqual(arr.size(), length);
            assert(arr.capacity() >= length, 'The typed array is too small!');
          }
        });
        
        it('should should throw RangeError if the initialized number is negative', () => {
          assert.throws(() => new DynamicTypedArray(TypedArrayConstructor, -65), RangeError);
        });
        
        it('should copy the content of an array-like initalizer', () => {
          const array = [0, 4, 6, 4, 6, 2, 6, 7, 3, 2, 7, 4, 2];
          const arr = new DynamicTypedArray(TypedArrayConstructor, array);

          assert.deepEqual(arr.toArray(), array);
        });
        
        it('should copy the content of an iterable initializer', () => {          
          const array = [0, 4, 6, 4, 6, 2, 6, 7, 3, 2, 7, 4, 2];
          
          const arr1 = new DynamicTypedArray(TypedArrayConstructor, array);
          
          // Dynamic arrays are iterable!
          
          const arr2 = new DynamicTypedArray(TypedArrayConstructor, arr1);
          
          assert.deepEqual(arr1.toArray(), arr2.toArray());
        });
        
        it('should throw TypeError if supplied an invalid initializer', () => {
          const invalidInitializers = [null, {}, function() {}, Math];
          
          for (let invalidInitializer of invalidInitializers) {
            assert.throws(() => new DynamicTypedArray(TypedArrayConstructor, invalidInitializer), TypeError, `Succeeded for invalid initializer: ${invalidInitializer}`);
          }
        });
      });

      describe('Custom allocator', () => {
        function createArrayWithCustomAllocator(customAllocator) {
          const arr = new DynamicTypedArray(TypedArrayConstructor, 0, { 
            allocator: customAllocator
          });
          arr.push(1, 5, 6);
        }
        
        it('should use a valid custom allocator', () => {
          let allocatorWasCalled = false;
          function customAllocator(byteLength) {
            allocatorWasCalled = true;
            return new ArrayBuffer(byteLength);
          }
          createArrayWithCustomAllocator(customAllocator);
          assert(allocatorWasCalled, 'Custom allocator was never called!');
        });
        
        it('should throw TypeError if an invalid custom allocator in used', () => {
          function invalidCustomAllocator(byteLength) {
            return {};
          }
          
          const invalidAllocators = [invalidCustomAllocator, 43, 'hello', null, {}];
          
          for (let invalidAllocator of invalidAllocators) {
            assert.throws(() => createArrayWithCustomAllocator(invalidAllocator), TypeError);
          }
        });
        
        it('should throw RangeError if the returned ArrayBuffer is too small', () => {
          function invalidCustomAllocator(byteLength) {
            return new ArrayBuffer(byteLength >>> 1);
          }

          assert.throws(() => createArrayWithCustomAllocator(invalidCustomAllocator), RangeError);
        });
      });
      
      describe('Custom deallocator', () => {
        function createArrayWithCustomDeallocator(customDeallocator) {
          const arr = new DynamicTypedArray(TypedArrayConstructor, 0, { 
            deallocator: customDeallocator
          });
          arr.push(1, 5, 6);
          arr.push(1, 5, 6, 9, 3, 2, 4, 9, 3, 1, 0, 3);
        }
        
        it('should use a valid custom allocator', () => {
          let deallocatorWasCalled = false;
          function customDeallocator(byteLength) {
            deallocatorWasCalled = true;
          }
          createArrayWithCustomDeallocator(customDeallocator);
          assert(deallocatorWasCalled, 'Custom deallocator was never called!');
        });
        
        it('should throw TypeError the deallocator is not a function', () => {
          const invalidDeallocators = [43, 'hello', null, {}];
          
          for (let invalidDeallocator of invalidDeallocators) {
            assert.throws(() => createArrayWithCustomDeallocator(invalidDeallocator), TypeError);
          }
        });
      });
      
      describe('Custom reallocator', () => {
        function testCustomReallocator(customReallocator) {
          const arr = new DynamicTypedArray(TypedArrayConstructor, 0, { 
            reallocator: customReallocator
          });
          arr.push(1, 5, 6);
          arr.push(1, 5, 6, 9, 3, 2, 4, 9, 3, 1, 0, 3);
        }
        
        it('should use a correct custom reallocator', () => {
          let reallocatorWasCalled = false;
          function customReallocator(oldBuffer, requestedByteLength) {
            reallocatorWasCalled = true;
            return new ArrayBuffer(requestedByteLength);
          }
          testCustomReallocator(customReallocator);
          assert(reallocatorWasCalled, 'Custom reallocator was never called!');
        });
        
        it('should throw TypeError the reallocator is invalid', () => {
          function invalidReallocator() {
            return 34;
          }
          
          const invalidReallocators = [invalidReallocator, 43, 'hello', null, {}];
          
          for (let invalidReallocator of invalidReallocators) {
            assert.throws(() => testCustomReallocator(invalidReallocator), TypeError);
          }
        });
      });
      
      describe('Custom growthPolicy', () => {
        function testCustomGrowthPolicy(customGrowthPolicy) {
          const arr = new DynamicTypedArray(TypedArrayConstructor, 0, { 
            growthPolicy: customGrowthPolicy
          });
          
          const requestedCapacity = 1024;
          const expectedNewCapacity = customGrowthPolicy(requestedCapacity);
          
          arr._ensureCapacity(requestedCapacity);
          
          assert.strictEqual(arr.capacity(), expectedNewCapacity);
        }
        
        it('should use a correct, custom growthPolicy', () => {
          function customGrowthPolicy(minCapacity) {
            return minCapacity * 3;
          }
          testCustomGrowthPolicy(customGrowthPolicy);
        });
        
        it('should throw TypeError if the growth policy is not a function', () => {
          const invalidValues = [{}, 0, 'hello', null];
          for (let invalidValue of invalidValues) {
            assert.throws(() => testCustomGrowthPolicy(invalidValue), TypeError);
          }
        });
        
        it('should throw TypeError if the growth policy does not return an integer', () => {
          function customGrowthPolicy(minCapacity) {
            return minCapacity * Math.SQRT2;
          }
          assert.throws(() => testCustomGrowthPolicy(customGrowthPolicy), TypeError);
        });
        
        it('should throw RangeError if the growth policy returns a smaller capacity than requested', () => {
          function customGrowthPolicy(minCapacity) {
            return minCapacity >>> 1;
          }
          
          assert.throws(() => testCustomGrowthPolicy(customGrowthPolicy), RangeError);
        });
      });

      describe('#push()', () => {
        it('should push one value', () => {
          const arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.strictEqual(arr.size(), 0);
          arr.push(5);
          assert.strictEqual(arr.size(), 1);
        });
        
        it('should push many values', () => {
          const arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.strictEqual(arr.size(), 0);
          arr.push(5, 6, 2, 8, 4);
          assert.strictEqual(arr.size(), 5);
        });
      });
      
      describe('#pop()', () => {
        it('should pop the last value', () => {
          const arr = new DynamicTypedArray(TypedArrayConstructor, [0, 1, 2]);
        
          assert.strictEqual(arr.size(), 3);
          const value = arr.pop();
          assert.strictEqual(value, 2);
          assert.strictEqual(arr.size(), 2);
        });
        
        it('should return undefined if the array is empty', () => {
          const arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.strictEqual(arr.size(), 0);
          const value = arr.pop();
          assert.strictEqual(value, undefined);
          assert.strictEqual(arr.size(), 0);
        });
      });
      
      describe('#get()', () => {
        const arr = new DynamicTypedArray(TypedArrayConstructor, [0, 1, 2, 3, 4]);
        
        it('should fetch a value at a valid position', () => {
          assert.strictEqual(arr.get(0), 0);
          assert.strictEqual(arr.get(4), 4);
        });
        
        it('should return undefined if outside the valid range', () => {
          assert.strictEqual(arr.get(-1), undefined);
          assert.strictEqual(arr.get(5), undefined);
        });
      });
      
      describe('#set()', () => {
        const arr = new DynamicTypedArray(TypedArrayConstructor);
        arr.push(0, 1, 2, 3, 4);
        
        it('should set a value at a valid position', () => {
          arr.set(0, 10);
          assert.strictEqual(arr.get(0), 10);
          arr.set(4, 34);
          assert.strictEqual(arr.get(4), 34);
        });
        
        it('should not allow to set a value outside the valid range', () => {
          arr.set(7, 9);
          assert.strictEqual(arr.get(7), undefined);
        });
      });
      
      describe('#forEach()', () => {
        it('should visit every element of the array', () => {
          const values = [1, 2, 3, 5];
          const arr = new DynamicTypedArray(TypedArrayConstructor, values);
          
          arr.forEach((n, i) => assert.strictEqual(n, values[i]));
        });
      });
      
      describe('#toArray()', () => {
        it('should produce a sliced normal array', () => {
          const values = [1, 2, 3, 5];
          const arr = new DynamicTypedArray(TypedArrayConstructor, values);
          assert.deepEqual(arr.toArray(), values);
        });
      });
      
      describe('#toJSON()', () => {
        it('should produce the same result as #toArray()', () => {
          const values = [1, 2, 3, 5, 7, 3, 54, 2];
          const arr = new DynamicTypedArray(TypedArrayConstructor, values);
          assert.deepEqual(arr.toArray(), values);
          assert.deepEqual(arr.toArray(), arr.toJSON());
        });
      });
      
      describe('#toString()', () => {
        it('should produce the same result as calling #toString() on its array representation', () => {
          const values = [1, 2, 3, 5, 7, 3, 54, 2];
          const arr = new DynamicTypedArray(TypedArrayConstructor, values);
          assert.deepEqual(arr.toString(), values.toString());
        });
      });
      
      describe('#_ensureCapacity()', () => {
        const arr = new DynamicTypedArray(TypedArrayConstructor);
        
        it('should grow to fit the requested capacity', () => {
          const oldCapacity = arr.capacity();
          const requestedCapacity = oldCapacity * 5;
          arr._ensureCapacity(requestedCapacity);
          const newCapacity = arr.capacity(); 
          assert(newCapacity >= requestedCapacity);
        });
      });
      
      describe('#_resize()', () => {
        it('should throw RangeError if the requested capicity is negative', () => {
          const arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.throws(() => arr._resize(-6), RangeError)
        });
        
        it('should shrink the length if the new capacity is smaller than the length', () => {
          const arr = new DynamicTypedArray(TypedArrayConstructor, 10);
          const oldLength = arr.size();
          arr._resize(5);
          const newLength = arr.size();
          assert(newLength < oldLength);
        });
      });
    });
  }
});
