import assert from 'node:assert';
import { describe, it } from 'node:test';
import { isFilterInputs, isSearchInputs, isUserContext } from '../../../listeners/functions/type-guards.js';
import type { FilterInputs, SearchInputs, UserContext } from '../../../listeners/functions/types.js';

describe('isUserContext', () => {
  it('should return true for valid UserContext objects', () => {
    const validContext: UserContext = {
      id: 'user123',
      secret: 'secret123',
    };
    assert(isUserContext(validContext));
  });

  it('should return false for objects missing required properties', () => {
    assert(!isUserContext({ id: 'user123' }));
    assert(!isUserContext({ secret: 'secret123' }));
    assert(!isUserContext({}));
  });

  it('should return false for objects with invalid property types', () => {
    assert(!isUserContext({ id: 123, secret: 'secret123' }));
    assert(!isUserContext({ id: 'user123', secret: 123 }));
    assert(!isUserContext(null));
    assert(!isUserContext(undefined));
  });
});

describe('isSearchInputs', () => {
  const validUserContext: UserContext = {
    id: 'user123',
    secret: 'secret123',
  };

  it('should return true for valid SearchInputs objects', () => {
    const validInputs: SearchInputs = {
      query: 'search term',
      filters: {},
      user_context: validUserContext,
    };
    assert(isSearchInputs(validInputs));
  });

  it('should return false for objects missing required properties', () => {
    assert(!isSearchInputs({ filters: {}, user_context: validUserContext }));
    assert(!isSearchInputs({ query: 'test', user_context: validUserContext }));
    assert(!isSearchInputs({ query: 'test', filters: {} }));
  });

  it('should return false for objects with invalid property types', () => {
    assert(
      !isSearchInputs({
        query: 123,
        filters: {},
        user_context: validUserContext,
      }),
    );
    assert(
      !isSearchInputs({
        query: 'test',
        filters: null,
        user_context: validUserContext,
      }),
    );
  });

  describe('isFilters', () => {
    it('should return true for valid filters object with all fields', () => {
      assert(
        isSearchInputs({
          query: 'search term',
          filters: {
            languages: ['typescript', 'javascript'],
            template: true,
            sample: false,
          },
          user_context: validUserContext,
        }),
      );
    });
    it('should return true for valid filters object with languages', () => {
      assert(
        isSearchInputs({
          query: 'search term',
          filters: {
            languages: ['typescript', 'javascript'],
          },
          user_context: validUserContext,
        }),
      );
    });

    it('should return false for invalid language values', () => {
      assert(
        !isSearchInputs({
          query: 'search term',
          filters: {
            languages: [123, 456],
          },
          user_context: validUserContext,
        }),
      );
      assert(
        !isSearchInputs({
          query: 'search term',
          filters: {
            languages: 'typescript',
          },
          user_context: validUserContext,
        }),
      );
    });

    it('should return false for invalid template/sample values', () => {
      assert(
        !isSearchInputs({
          query: 'search term',
          filters: {
            template: 'true',
          },
          user_context: validUserContext,
        }),
      );
      assert(
        !isSearchInputs({
          query: 'search term',
          filters: {
            sample: 123,
          },
          user_context: validUserContext,
        }),
      );
    });
  });
});

describe('isFilterInputs', () => {
  it('should return true for valid FilterInputs objects', () => {
    const validInputs: FilterInputs = {
      user_context: {
        id: 'user123',
        secret: 'secret123',
      },
    };
    assert(isFilterInputs(validInputs));
  });

  it('should return false for objects missing user_context', () => {
    assert(!isFilterInputs({}));
  });

  it('should return false for objects with invalid user_context', () => {
    assert(
      !isFilterInputs({
        user_context: { id: 'user123' },
      }),
    );
    assert(
      !isFilterInputs({
        user_context: null,
      }),
    );
  });
});
