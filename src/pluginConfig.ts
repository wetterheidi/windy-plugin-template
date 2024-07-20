import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-pressure-difference',
    version: '0.0.2',
    title: 'Pressure Difference Charts Alps',
    icon: '⛰️',
    description: 'Displays pressure difference diagrams for various cross sections.',
    author: 'HS',
    repository: 'https://github.com/wetterheidi/windy-plugin-pressure-difference-charts',
    desktopUI: 'rhpane',
    mobileUI: 'fullscreen',
    routerPath: '/foehn-chart-alps',
    desktopWidth: 800,
    private: true,
};

export default config;
