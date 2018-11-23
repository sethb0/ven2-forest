<template>
  <vk-navbar id="navbar" class="uk-light">
    <vk-navbar-logo id="logo">
      <img :src="logo" alt="Venator logo">
    </vk-navbar-logo>

    <template v-if="connected">
      <vk-navbar-nav>
        <vk-navbar-nav-dropdown title="Type" :offset="0" :delay-hide="300">
          <vk-navbar-nav-dropdown-nav>
            <vk-nav-item v-for="x in exaltedTypes" :key="x" :active="x === activeType"
              @click="selectType(x)" :title="x"
            ></vk-nav-item>

            <vk-nav-item-divider v-if="exaltedTypes.length && nonExaltedTypes.length">
            </vk-nav-item-divider>

            <vk-nav-item v-for="x in nonExaltedTypes" :key="x" :active="x === activeType"
              @click="selectType(x)" :title="x"
            ></vk-nav-item>

            <vk-nav-item-divider
              v-if="(exaltedTypes.length || nonExaltedTypes.length) && martialArtsTypes.length"
            >
            </vk-nav-item-divider>

            <vk-nav-item v-for="x in martialArtsTypes" :key="x" :active="x === activeType"
              @click="selectType(x)" :title="x"
            ></vk-nav-item>
          </vk-navbar-nav-dropdown-nav>
        </vk-navbar-nav-dropdown>

        <vk-navbar-nav-dropdown v-if="groups.length" :title="groupsTitle"
          :offset="0" :delay-hide="300"
        >
          <vk-navbar-nav-dropdown-nav>
            <vk-nav-item v-for="x in groups" :key="x" :active="x === activeGroup"
              @click="selectGroup(x)" :title="x"
            ></vk-nav-item>
          </vk-navbar-nav-dropdown-nav>
        </vk-navbar-nav-dropdown>
      </vk-navbar-nav>

      <vk-navbar-nav slot="center">
        <vk-navbar-item>
          <h4 class="brand-font uk-margin-remove-bottom">{{ title }}</h4>
        </vk-navbar-item>
      </vk-navbar-nav>

      <vk-navbar-nav slot="right">
        <vk-navbar-item>
          <vk-button @click="disconnect" size="small">
            Disconnect
          </vk-button>
        </vk-navbar-item>
      </vk-navbar-nav>
    </template>

    <vk-navbar-nav v-else slot="right">
      <vk-navbar-item>
        <form action="javascript:void(0)">
          <input v-model="username" type="text" placeholder="Username"
            class="uk-input uk-form-width-small uk-margin-small-right"
          >
          <input v-model="password" type="password" placeholder="Password"
            class="uk-input uk-form-width-small uk-margin-small-right"
          >
          <vk-button @click="connect" size="small" type="primary" html-type="submit">
            Connect
          </vk-button>
        </form>
      </vk-navbar-item>
    </vk-navbar-nav>
  </vk-navbar>
</template>

<style>
#logo img { width: 64px; height: 64px; }
#navbar { background-color: #082567; /* sapphire blue */ }
</style>

<script>
import { ipcRenderer } from 'electron';
import { mapState } from 'vuex/dist/vuex.esm';
import { Button } from 'vuikit/lib/button';
import { Navbar, NavbarNav, NavbarLogo, NavbarItem, NavbarNavDropdown, NavbarNavDropdownNav }
  from 'vuikit/lib/navbar';
import { NavItem, NavItemDivider } from 'vuikit/lib/nav';

import logo from '../assets/logo.svg';
import { toKebab } from '../../common/util';

export default {
  components: {
    VkButton: Button,
    VkNavbar: Navbar,
    VkNavbarNav: NavbarNav,
    VkNavbarLogo: NavbarLogo,
    VkNavbarItem: NavbarItem,
    VkNavbarNavDropdown: NavbarNavDropdown,
    VkNavbarNavDropdownNav: NavbarNavDropdownNav,
    VkNavItem: NavItem,
    VkNavItemDivider: NavItemDivider,
  },
  data () {
    return {
      logo,
      username: '',
      password: '',
    };
  },
  computed: {
    ...mapState([
      'connected', 'enabledTypes', 'groups', 'activeType', 'activeGroup', 'title',
    ]),
    groupsTitle () {
      return this.activeType.endsWith(' Martial Arts') ? 'Style' : 'Group';
    },
    exaltedTypes () {
      return [
        'Abyssal', 'Alchemical', 'Dragon-Blooded', 'Infernal', 'Lunar', 'Sidereal', 'Solar',
      ].filter((x) => this.enabledTypes.includes(toKebab(x)));
    },
    nonExaltedTypes () {
      return [
        'Knacks', 'Jadeborn', 'Raksha',
      ].filter((x) => this.enabledTypes.includes(toKebab(x)));
    },
    martialArtsTypes () {
      return [
        'Terrestrial Martial Arts', 'Celestial Martial Arts', 'Sidereal Martial Arts',
      ].filter((x) => this.enabledTypes.includes(toKebab(x)));
    },
  },
  methods: {
    connect () {
      ipcRenderer.send('connect', { username: this.username, password: this.password });
    },
    disconnect () {
      ipcRenderer.send('disconnect');
    },
    selectType (x) {
      this.$store.commit('activeType', x);
    },
    selectGroup (x) {
      this.$store.commit('activeGroup', x);
    },
  },
  watch: {
    connected (newValue) {
      if (newValue) {
        this.password = '';
      }
    },
  },
};
</script>
