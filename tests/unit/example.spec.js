import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import HelloWorld from '@/renderer/components/HelloWorld.vue';

describe('HelloWorld.vue', function () {
  it('renders props.msg when passed', function () {
    const msg = 'new message';
    const wrapper = shallowMount(HelloWorld, {
      propsData: { msg },
    });
    expect(wrapper.text()).to.include(msg);
  });
});
