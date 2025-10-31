import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { $, createElement } from '../utils/dom.js';

describe('DOM utility library', () => {
  let testContainer: HTMLElement;

  beforeEach(() => {
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    testContainer.remove();
  });

  describe('$ selector', () => {
    it('should select elements by selector', () => {
      testContainer.innerHTML = '<div class="test">Hello</div>';
      const el = $('#test-container .test');
      expect(el.length).toBe(1);
    });

    it('should wrap HTMLElement', () => {
      const div = document.createElement('div');
      const el = $(div);
      expect(el.length).toBe(1);
    });

    it('should handle null selector', () => {
      const el = $(null);
      expect(el.length).toBe(0);
    });
  });

  describe('DOM manipulation', () => {
    it('should add and remove classes', () => {
      testContainer.innerHTML = '<div class="test"></div>';
      const el = $('#test-container .test');
      el.addClass('foo');
      expect(testContainer.querySelector('.foo')).toBeTruthy();
      el.removeClass('foo');
      expect(testContainer.querySelector('.foo')).toBeFalsy();
    });

    it('should set CSS properties', () => {
      testContainer.innerHTML = '<div class="test"></div>';
      const el = $('#test-container .test');
      el.css({ width: '100px', height: '200px' });
      const div = testContainer.querySelector('.test') as HTMLElement;
      expect(div.style.width).toBe('100px');
      expect(div.style.height).toBe('200px');
    });

    it('should get CSS properties', () => {
      testContainer.innerHTML = '<div class="test" style="width: 100px;"></div>';
      const el = $('#test-container .test');
      const width = el.css('width');
      expect(width).toBe('100px');
    });

    it('should append elements', () => {
      const parent = createElement('div', { class: 'parent' });
      const child = createElement('div', { class: 'child' });
      parent.append(child);
      expect(parent.children().length).toBe(1);
    });

    it('should prepend elements', () => {
      const parent = createElement('div');
      parent.append(createElement('div', { class: 'second' }));
      parent.prepend(createElement('div', { class: 'first' }));
      expect(parent.children().get(0)?.classList.contains('first')).toBe(true);
    });
  });

  describe('data storage', () => {
    it('should store and retrieve data', () => {
      const el = createElement('div');
      el.data('foo', 'bar');
      expect(el.data('foo')).toBe('bar');
    });

    it('should return data map when no key provided', () => {
      const el = createElement('div');
      el.data('test', 123);
      const data = el.data();
      expect(data.get('test')).toBe(123);
    });
  });

  describe('events', () => {
    it('should bind and trigger events', () => {
      let called = false;
      const el = createElement('div');
      el.on('click', () => { called = true; });
      el.trigger('click');
      expect(called).toBe(true);
    });

    it('should unbind events', () => {
      let count = 0;
      const handler = () => { count++; };
      const el = createElement('div');
      el.on('click', handler);
      el.trigger('click');
      el.off('click', handler);
      el.trigger('click');
      expect(count).toBe(1);
    });
  });

  describe('dimensions', () => {
    it('should return element width and height', () => {
      testContainer.innerHTML = '<div style="width: 100px; height: 50px;"></div>';
      const el = $('#test-container div');
      expect(el.width()).toBeGreaterThanOrEqual(0);
      expect(el.height()).toBeGreaterThanOrEqual(0);
    });

    it('should return element offset', () => {
      testContainer.innerHTML = '<div></div>';
      const el = $('#test-container div');
      const offset = el.offset();
      expect(typeof offset.top).toBe('number');
      expect(typeof offset.left).toBe('number');
    });
  });

  describe('createElement', () => {
    it('should create element with class', () => {
      const el = createElement('div', { class: 'test-class' });
      expect(el.get(0)?.classList.contains('test-class')).toBe(true);
    });

    it('should create element with CSS', () => {
      const el = createElement('div', { 
        css: { width: '100px', height: '50px' } 
      });
      const div = el.get(0) as HTMLElement;
      expect(div.style.width).toBe('100px');
      expect(div.style.height).toBe('50px');
    });
  });

  describe('utility methods', () => {
    it('should extend objects', () => {
      const result = $.extend<Record<string, number>>({ a: 1 }, { b: 2 }, { c: 3 });
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should check array membership', () => {
      expect($.inArray('b', ['a', 'b', 'c'])).toBe(1);
      expect($.inArray('d', ['a', 'b', 'c'])).toBe(-1);
    });
  });
});
