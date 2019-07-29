import Service, {inject} from '@ember/service';
import {Subject} from 'rxjs';
import {fromEvent, filter, map} from 'rxjs/operators';

export const ready = navigator.serviceWorker.ready.then(function(reg) {
  if (!navigator.serviceWorker.controller) {
    console.log('no controlling worker!');
    location.reload();
  }
  let send = (kind,value) => navigator.serviceWorker.controller.postMessage({kind,value});

  // we want to avoid opening websockets and such for not-yet-active
  // service workers. buuuut you can't actually tell from inside the
  // service worker whether you're active or not. you can listen to
  // the 'activate' event, but that only fires once, *ever*, per sw.
  // the sw can be shut down due to no open tabs, then run again later,
  // and have no way to tell that it's already been activated.
  // so, we just ping from every active tab when they first start up,
  // and that will trigger socket initialization in the sw if necessary.

  send('init');

  // these events aren't available within the service worker, but
  // they're useful hints for websocket reconnection attempts,
  // so we forward them along
  window.addEventListener('online', () => send('online'));
  window.addEventListener('offline', () => send('offline'));

  // firefox shuts down service workers after 30 seconds of idle.
  // but, we want it to keep the socket open in case of server events
  setInterval(() => send('keepawake'), 25000);
});

export default class extends Service {
  events = new Subject();

  init() {
    fromEvent(navigator.serviceWorker, 'message', e => e.data)
      .subscribe(events);
  }

  // event data comes through as a simple string (the event name),
  // or a two-element array [eventName, payload].
  on(eventName) {
    return this.events.pipe(
        filter(d => d === eventName || Array.isArray(d) && d[0] === eventName),
        map(d => Array.isArray(d) ? d[1] : null)
    );
  },

  send(eventName, data) {
    if (!navigator.serviceWorker.controller) {
      throw new Error('No controlling service worker!');
    }
    if (data) {
      navigator.serviceWorker.controller.postMessage([eventName,data]);
    } else {
      navigator.serviceWorker.controller.postMessage(eventName);
    }
  }
}
