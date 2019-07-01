import {isFieldDescriptor} from 'nomicon/lib/decorators';

export function keepLatest(target,key,desc) {
  return {
    configurable: true,
    get() {
      let running = false;
      let again = false;

      async function f() {
        if (running) {
          again = true;
          return;
        }
        running = true;
        await desc.value.apply(this, arguments);
        running = false;
        if (again) {
          again = false;
          f();
        }
      }

      Object.defineProperty(this, key, {
        configurable: true,
        writable: true,
        value: f,
      });

      return f;
    }
  };
}

export function drop(target,key,desc) {
  return {
    configurable: true,
    get() {
      let running = false;

      async function f() {
        if (running) { return; }
        running = true;
        await desc.value.apply(this, arguments);
        running = false;
      }

      Object.defineProperty(this, key, {
        configurable: true,
        writable: true,
        value: f,
      });

      return f;
    }
  };
}
