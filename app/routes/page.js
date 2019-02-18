import Route from '@ember/routing/route';

export default Route.extend({
  model({page_id}) {
    return page_id;
  }
});
