'use strict';

var assert = require('assert');
var DynamicTypedArray = require('../dist/dynamic-typed-array');

describe('DynamicTypedArray', function () {
  var supportedConstructors = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];

  supportedConstructors.forEach(function (TypedArrayConstructor) {
    var constructorName = TypedArrayConstructor.name;

    describe('backed by ' + constructorName, function () {
      describe('#new()', function () {
        it('should default to using Float64Array', function () {
          var arr = new DynamicTypedArray();
          assert(arr._array instanceof Float64Array);
        });

        it('should throw TypeError if the supplied constructor is not a typed array constructor', function () {
          var invalidValues = [Array, String, [], {}, function () {}, 0, 'hello', null];
          invalidValues.forEach(function (invalidValue) {
            assert.throws(function () { new DynamicTypedArray(invalidValue); }, TypeError);
          });
        });

        it('should create a typed array of type ' + constructorName, function () {
          var arr = new DynamicTypedArray(TypedArrayConstructor);
          assert(arr._array instanceof TypedArrayConstructor);
        });

        it('should default to length 0', function () {
          var arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.strictEqual(arr.size(), 0);
        });

        it('should be initialized to a custom size', function () {
          var lengths = [5, 54, 95, 2, 6, 4, 23, 0, 5];
          lengths.forEach(function (length) {
            var arr = new DynamicTypedArray(TypedArrayConstructor, length);
            assert.strictEqual(arr.size(), length);
            assert(arr.capacity() >= length, 'The typed array is too small!');
          });
        });

        it('should should throw RangeError if the initialized number is negative', function () {
          assert.throws(function () { new DynamicTypedArray(TypedArrayConstructor, -65); }, RangeError);
        });

        it('should copy the content of an array-like initalizer', function () {
          var array = [0, 4, 6, 4, 6, 2, 6, 7, 3, 2, 7, 4, 2];
          var arr = new DynamicTypedArray(TypedArrayConstructor, array);

          assert.deepEqual(arr.toArray(), array);
        });

        it('should copy the content of an iterable initializer', function () {
          var array = [0, 4, 6, 4, 6, 2, 6, 7, 3, 2, 7, 4, 2];

          var arr1 = new DynamicTypedArray(TypedArrayConstructor, array);

          // Dynamic arrays are iterable!
          var arr2 = new DynamicTypedArray(TypedArrayConstructor, arr1);

          assert.deepEqual(arr1.toArray(), arr2.toArray());
        });

        it('should throw TypeError if supplied an invalid initializer', function () {
          var invalidInitializers = [null, {}, function () {}, Math];

          invalidInitializers.forEach(function (invalidInitializer) {
            assert.throws(function () {
              new DynamicTypedArray(TypedArrayConstructor, invalidInitializer);
            }, TypeError, 'Succeeded for invalid initializer: ' + invalidInitializer);
          });
        });
      });

      describe('Custom allocator', function () {
        function createArrayWithCustomAllocator(customAllocator) {
          var arr = new DynamicTypedArray(TypedArrayConstructor, 0, {
            allocator: customAllocator
          });
          arr.push(1, 5, 6);
        }

        it('should use a valid custom allocator', function () {
          var allocatorWasCalled = false;
          function customAllocator(byteLength) {
            allocatorWasCalled = true;
            return new ArrayBuffer(byteLength);
          }
          createArrayWithCustomAllocator(customAllocator);
          assert(allocatorWasCalled, 'Custom allocator was never called!');
        });

        it('should throw TypeError if an invalid custom allocator in used', function () {
          function invalidCustomAllocator(byteLength) {
            return {};
          }

          var invalidAllocators = [invalidCustomAllocator, 43, 'hello', null, {}];

          invalidAllocators.forEach(function (invalidAllocator) {
            assert.throws(function () { createArrayWithCustomAllocator(invalidAllocator); }, TypeError);
          });
        });

        it('should throw RangeError if the returned ArrayBuffer is too small', function () {
          function invalidCustomAllocator(byteLength) {
            return new ArrayBuffer(byteLength >>> 1);
          }

          assert.throws(function () { createArrayWithCustomAllocator(invalidCustomAllocator); }, RangeError);
        });
      });

      describe('Custom deallocator', function () {
        function createArrayWithCustomDeallocator(customDeallocator) {
          var arr = new DynamicTypedArray(TypedArrayConstructor, 0, {
            deallocator: customDeallocator
          });
          arr.push(1, 5, 6);
          arr.push(1, 5, 6, 9, 3, 2, 4, 9, 3, 1, 0, 3);
        }

        it('should use a valid custom allocator', function () {
          var deallocatorWasCalled = false;
          function customDeallocator(byteLength) {
            deallocatorWasCalled = true;
          }
          createArrayWithCustomDeallocator(customDeallocator);
          assert(deallocatorWasCalled, 'Custom deallocator was never called!');
        });

        it('should throw TypeError the deallocator is not a function', function () {
          var invalidDeallocators = [43, 'hello', null, {}];

          invalidDeallocators.forEach(function (invalidDeallocator) {
            assert.throws(function () { createArrayWithCustomDeallocator(invalidDeallocator); }, TypeError);
          });
        });
      });

      describe('Custom reallocator', function () {
        function testCustomReallocator(customReallocator) {
          var arr = new DynamicTypedArray(TypedArrayConstructor, 0, {
            reallocator: customReallocator
          });
          arr.push(1, 5, 6);
          arr.push(1, 5, 6, 9, 3, 2, 4, 9, 3, 1, 0, 3);
        }

        it('should use a correct custom reallocator', function () {
          var reallocatorWasCalled = false;
          function customReallocator(oldBuffer, requestedByteLength) {
            reallocatorWasCalled = true;
            return new ArrayBuffer(requestedByteLength);
          }
          testCustomReallocator(customReallocator);
          assert(reallocatorWasCalled, 'Custom reallocator was never called!');
        });

        it('should throw TypeError the reallocator is invalid', function () {
          function invalidReallocator() {
            return 34;
          }

          var invalidReallocators = [invalidReallocator, 43, 'hello', null, {}];

          invalidReallocators.forEach(function (invalidReallocator) {
            assert.throws(function () { testCustomReallocator(invalidReallocator); }, TypeError);
          });
        });
      });

      describe('Custom growthPolicy', function () {
        function testCustomGrowthPolicy(customGrowthPolicy) {
          var arr = new DynamicTypedArray(TypedArrayConstructor, 0, {
            growthPolicy: customGrowthPolicy
          });

          var requestedCapacity = 1024;
          var expectedNewCapacity = customGrowthPolicy(requestedCapacity);

          arr._ensureCapacity(requestedCapacity);

          assert.strictEqual(arr.capacity(), expectedNewCapacity);
        }

        it('should use a correct, custom growthPolicy', function () {
          function customGrowthPolicy(minCapacity) {
            return minCapacity * 3;
          }
          testCustomGrowthPolicy(customGrowthPolicy);
        });

        it('should throw TypeError if the growth policy is not a function', function () {
          var invalidValues = [{}, 0, 'hello', null];
          invalidValues.forEach(function (invalidValue) {
            assert.throws(function () { testCustomGrowthPolicy(invalidValue); }, TypeError);
          });
        });

        it('should throw TypeError if the growth policy does not return an integer', function () {
          function customGrowthPolicy(minCapacity) {
            return minCapacity * Math.SQRT2;
          }
          assert.throws(function () { testCustomGrowthPolicy(customGrowthPolicy); }, TypeError);
        });

        it('should throw RangeError if the growth policy returns a smaller capacity than requested', function () {
          function customGrowthPolicy(minCapacity) {
            return minCapacity >>> 1;
          }

          assert.throws(function () { testCustomGrowthPolicy(customGrowthPolicy); }, RangeError);
        });
      });

      describe('#push()', function () {
        it('should push one value', function () {
          var arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.strictEqual(arr.size(), 0);
          arr.push(5);
          assert.strictEqual(arr.size(), 1);
        });

        it('should push many values', function () {
          var arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.strictEqual(arr.size(), 0);
          arr.push(5, 6, 2, 8, 4);
          assert.strictEqual(arr.size(), 5);
        });
      });

      describe('#pop()', function () {
        it('should pop the last value', function () {
          var arr = new DynamicTypedArray(TypedArrayConstructor, [0, 1, 2]);

          assert.strictEqual(arr.size(), 3);
          var value = arr.pop();
          assert.strictEqual(value, 2);
          assert.strictEqual(arr.size(), 2);
        });

        it('should return undefined if the array is empty', function () {
          var arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.strictEqual(arr.size(), 0);
          var value = arr.pop();
          assert.strictEqual(value, undefined);
          assert.strictEqual(arr.size(), 0);
        });
      });

      describe('#get()', function () {
        var arr = new DynamicTypedArray(TypedArrayConstructor, [0, 1, 2, 3, 4]);

        it('should fetch a value at a valid position', function () {
          assert.strictEqual(arr.get(0), 0);
          assert.strictEqual(arr.get(4), 4);
        });

        it('should return undefined if outside the valid range', function () {
          assert.strictEqual(arr.get(-1), undefined);
          assert.strictEqual(arr.get(5), undefined);
        });
      });

      describe('#set()', function () {
        var arr = new DynamicTypedArray(TypedArrayConstructor);
        arr.push(0, 1, 2, 3, 4);

        it('should set a value at a valid position', function () {
          arr.set(0, 10);
          assert.strictEqual(arr.get(0), 10);
          arr.set(4, 34);
          assert.strictEqual(arr.get(4), 34);
        });

        it('should not allow to set a value outside the valid range', function () {
          arr.set(7, 9);
          assert.strictEqual(arr.get(7), undefined);
        });
      });

      describe('#forEach()', function () {
        it('should visit every element of the array', function () {
          var values = [1, 2, 3, 5];
          var arr = new DynamicTypedArray(TypedArrayConstructor, values);

          arr.forEach(function (n, i) {
            return assert.strictEqual(n, values[i]);
          });
        });
      });

      describe('#toArray()', function () {
        it('should produce a sliced normal array', function () {
          var values = [1, 2, 3, 5];
          var arr = new DynamicTypedArray(TypedArrayConstructor, values);
          assert.deepEqual(arr.toArray(), values);
        });
      });

      describe('#toJSON()', function () {
        it('should produce the same result as #toArray()', function () {
          var values = [1, 2, 3, 5, 7, 3, 54, 2];
          var arr = new DynamicTypedArray(TypedArrayConstructor, values);
          assert.deepEqual(arr.toArray(), values);
          assert.deepEqual(arr.toArray(), arr.toJSON());
        });
      });

      describe('#toString()', function () {
        it('should produce the same result as calling #toString() on its array representation', function () {
          var values = [1, 2, 3, 5, 7, 3, 54, 2];
          var arr = new DynamicTypedArray(TypedArrayConstructor, values);
          assert.deepEqual(arr.toString(), values.toString());
        });
      });

      describe('#_ensureCapacity()', function () {
        var arr = new DynamicTypedArray(TypedArrayConstructor);

        it('should grow to fit the requested capacity', function () {
          var oldCapacity = arr.capacity();
          var requestedCapacity = oldCapacity * 5;
          arr._ensureCapacity(requestedCapacity);
          var newCapacity = arr.capacity();
          assert(newCapacity >= requestedCapacity);
        });
      });

      describe('#_resize()', function () {
        it('should throw RangeError if the requested capicity is negative', function () {
          var arr = new DynamicTypedArray(TypedArrayConstructor);
          assert.throws(function () { arr._resize(-6); }, RangeError);
        });

        it('should shrink the length if the new capacity is smaller than the length', function () {
          var arr = new DynamicTypedArray(TypedArrayConstructor, 10);
          var oldLength = arr.size();
          arr._resize(5);
          var newLength = arr.size();
          assert(newLength < oldLength);
        });
      });
    });
  });
});
