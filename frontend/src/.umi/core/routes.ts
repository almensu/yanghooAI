// @ts-nocheck
import React from 'react';
import { ApplyPluginsType } from '/Volumes/2T/com/yanghoo205/img2ui-ant.design/frontend/node_modules/@umijs/runtime';
import * as umiExports from './umiExports';
import { plugin } from './plugin';

export function getRoutes() {
  const routes = [
  {
    "path": "/",
    "component": require('@/layouts/AppLayout').default,
    "routes": [
      {
        "path": "/",
        "component": require('@/pages/Home').default,
        "exact": true
      },
      {
        "path": "/video-data",
        "component": require('@/pages/VideoData').default,
        "exact": true
      },
      {
        "path": "/video/:hash_name",
        "component": require('@/pages/VideoPlayer').default,
        "exact": true
      },
      {
        "path": "/transcript/:hashName",
        "component": require('@/pages/TranscriptPage').default,
        "exact": true
      }
    ]
  }
];

  // allow user to extend routes
  plugin.applyPlugins({
    key: 'patchRoutes',
    type: ApplyPluginsType.event,
    args: { routes },
  });

  return routes;
}
