import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-pressure-difference',
    version: '0.0.5',
    title: 'Pressure Difference Charts Alps',
    icon: '⛰️',
    description: 'Displays pressure difference diagrams for various cross sections.',
    author: 'HS',
    repository: 'https://github.com/wetterheidi/windy-plugin-pressure-difference.git',
    desktopUI: 'rhpane',
    mobileUI: 'fullscreen',
    routerPath: '/pressure-difference',
    desktopWidth: 800,
    private: false,
};

export default config;
