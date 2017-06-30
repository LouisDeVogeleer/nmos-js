"use strict";

var myApp = angular.module('myApp', ['ng-admin', 'angularUserSettings']);

myApp.config(['NgAdminConfigurationProvider', function (nga) {

  // Application, mostly just using the Query API (by default, on the same host as this Admin UI, but loaded from $userSettings at run-time)
  // Logging API is on a different port on the same host

  var adminHost = window.location.hostname;
  var queryPort = 3211;
  var loggingPort = 5106;

  var queryUrl = 'http://' + adminHost + ':' + queryPort + '/x-nmos/query/v1.2/';
  var loggingUrl = 'http://' + adminHost + ':' + loggingPort + '/log/';

  var admin = nga.application('sea-lion').baseApiUrl(queryUrl);

  // my modern CSS voodoo is sorely lacking
  admin.header(
    '<div class="navbar-header ng-scope">' +
      '<img src="./images/sonyLogo.png" style="height:50px" alt="Sony Logo"/><img src="./images/seaLion.png" style="height:50px" alt="sea-lion"/>' +
      '<a class="navbar-brand" style="float:none" href="#" ng-click="appController.displayHome()">' +
        'sea-lion' +
      '</a>' +
    '</div>'
    );

  // Entities

  var nodes = nga.entity('nodes').readOnly();
  var devices = nga.entity('devices').readOnly();
  var sources = nga.entity('sources').readOnly();
  var flows = nga.entity('flows').readOnly();
  var senders = nga.entity('senders').readOnly();
  var receivers = nga.entity('receivers').readOnly();
  var subscriptions = nga.entity('subscriptions').readOnly();
  var logs = nga.entity('events').label('Logs').baseApiUrl(loggingUrl).readOnly();

  // Templates and common definitions

  const LIST_VIEW_ACTIONS = [
    'filter',
    '<ma-reload-button label="Reload"/>'
  ];

  const LIST_ENTRY_ACTIONS = [
    'show'
  ];

  const SHOW_VIEW_ACTIONS = [
    'list',
    '<ma-reload-button label="Reload"/>'
  ];

  const FORMAT_CHOICES = [
    { value: 'urn:x-nmos:format:video', label: 'Video' },
    { value: 'urn:x-nmos:format:audio', label: 'Audio' },
    { value: 'urn:x-nmos:format:data', label: 'Data' },
    { value: 'urn:x-nmos:format:mux', label: 'Mux' }
  ];

  const TRANSPORT_CHOICES = [
    { value: 'urn:x-nmos:transport:rtp', label: 'RTP (Real-time Transport Protocol)' },
    { value: 'urn:x-nmos:transport:rtp.mcast', label: 'RTP.mcast (Multicast Real-time Transport Protocol)' },
    { value: 'urn:x-nmos:transport:rtp.ucast', label: 'RTP.ucast (Unicast Real-time Transport Protocol)' },
    { value: 'urn:x-nmos:transport:dash', label: 'DASH (Dynamic Adaptive Streaming over HTTP)' }
  ];

  const TYPE_CHOICES = [
    { value: 'urn:x-nmos:device:generic', label: 'Generic' },
    { value: 'urn:x-nmos:device:pipeline', label: 'Pipeline' }
  ];

  const INTERLACE_MODE_CHOICES = [
    { value: 'progressive', label: 'Progressive' },
    { value: 'interlaced_tff', label: 'Interlaced, top field first' },
    { value: 'interlaced_bff', label: 'Interlaced, bottom field first' },
    { value: 'interlaced_psf', label: 'Progressive segmented frame' }
  ];

  const COLORSPACE_CHOICES = [
    { value: 'BT601', label: 'ITU-R Recommendation BT.601 (SD)' },
    { value: 'BT709', label: 'ITU-R Recommendation BT.709 (HD)' },
    { value: 'BT2020', label: 'ITU-R Recommendation BT.2020 (UHD)' },
    { value: 'BT2100', label: 'ITU-R Recommendation BT.2100 (HDR)' }
  ];

  const TRANSFER_CHARACTERISTIC_CHOICES = [
    { value: 'SDR', label: 'SDR (Standard Dynamic Range)' },
    { value: 'HLG', label: 'HLG (Hybrid Log-Gamma)' },
    { value: 'PQ', label: 'PQ (Perceptual Quantizer)' }
  ];

  const FILTER_TEMPLATE =
    '<div class="input-group">' +
      '<input type="text" ng-model="value" placeholder="{{field._label == null ? field._name.substr(0,1).toUpperCase() + field._name.substr(1) : field._label}}" class="form-control"></input>' +
      '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>' +
    '</div>';

  const RESOURCE_TITLE_EXPRESSION = 
    'entry.values.label != \'\' ? entry.values.label : entry.values.id + \'(unlabelled)\'';

  const RESOURCE_TITLE_TEMPLATE =
    '{{' + RESOURCE_TITLE_EXPRESSION + '}}';

  const URL_VALUE_TEMPLATE =
    '<a href="{{value}}">{{value}}</a>';

  const RATIONAL_VALUE_EXPRESSION =
    'value.numerator + \':\' + value.denominator';

  const RATIONAL_VALUE_TEMPLATE =
    '<span ng-if="value">{{' + RATIONAL_VALUE_EXPRESSION + '}}</span>';

  function horizontalRuleField() {
    return nga.field('').template('<hr/>', true);
  }

  
  function resourceCoreFields() {
    return [
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('version'),
      nga.field('label'),
      nga.field('description'),
      nga.field('tags', 'json')
    ];
  }

  const RESOURCE_TARGET_FIELD =
    nga.field('label').isDetailLink(true).sortable(false).template(
      '<a ui-sref="{{detailState}}(detailStateParams)">' +
        '<ma-string-column value="' + RESOURCE_TITLE_EXPRESSION + '"></ma-string-column>' +
      '</a>'
    );

  function resourceTitleTemplate(resourceType) {
    return resourceType + ": " + RESOURCE_TITLE_TEMPLATE;
  }

  function spanIf(format, mediaType, content) {
    const span =
      '<span ' +
        'ng-if="' +
          'entry.values.format == \'' + format + '\'' +
          (mediaType !== undefined ? ' && entry.values.media_type == \'' + mediaType + '\'' : '') +
        '">' +
        content +
      '</span>';
    return span;
  }

  function showItemTemplate(format, mediaType) {
    return spanIf(
      format,
      mediaType,
      '<ma-show-item field="::field" entry="::entry" entity="::showController.entity" datastore="::showController.dataStore"></ma-show-item>'
    );
  }

  function showStringItemTemplate(expression, format, mediaType) {
    return spanIf(
      format,
      mediaType,
      // expand ma-show-item with ma-string-column of expression
      '<div class="col-lg-12 form-group">' +
      '    <label class="col-sm-2 control-label">{{ field.label() | translate }}</label>' +
      '    <div class="show-value" ng-class="(field.getCssClasses(entry) || \'col-sm-10 col-md-8 col-lg-7\')">' +
      '        <div ng-class="::\'ng-admin-field-\' + field.name() + \' \' + \'ng-admin-type-string\'">' +
      '            <ma-string-column value="value = entry.values[field.name()]; ' + expression + '"></ma-string-column>' +
      '        </div>' +
      '    </div>' +
      '</div>'
    );
  }

  // Nodes list view

  nodes.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('hostname').sortable(false),
      nga.field('api.versions', 'string').label('Node API Versions').map((versions) => { return versions instanceof Array ? versions.toString() : null; }).sortable(false)
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('hostname')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('api.versions', 'json').label('Node API Versions')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Node show view

  nodes.showView()
    .title(resourceTitleTemplate('Node'))
    .fields([
      resourceCoreFields(),
      nga.field('href').template(URL_VALUE_TEMPLATE).label('Address'),
      nga.field('hostname'),
      nga.field('api.versions', 'json').label('Node API Versions'),
      nga.field('api.endpoints', 'json').label('Node API Address Fragments'),
      nga.field('caps', 'json').label('Capabilities'), // (not yet defined)
      nga.field('services', 'json'),
      nga.field('clocks', 'json'),
      nga.field('interfaces', 'json'),
      horizontalRuleField(),
      nga.field('devices', 'referenced_list')
        .targetEntity(devices)
        .targetReferenceField('node_id')
        .targetFields([RESOURCE_TARGET_FIELD])
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(nodes);

  // Devices list view

  devices.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('type', 'choice').sortable(false).choices(TYPE_CHOICES)
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('type')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Devices show view

  devices.showView()
    .title(resourceTitleTemplate('Device'))
    .fields([
      resourceCoreFields(),
      nga.field('type', 'choice').choices(TYPE_CHOICES),
      nga.field('node_id', 'reference')
        .targetEntity(nodes)
        .targetField(nga.field('label'))
        .label('Node'),
      // 'senders' and 'receivers' are being deprecated in v1.2, and easily replaced by the equivalent 'refererenced_list' fields below
      //nga.field('senders', 'reference_many')
      //  .targetEntity(senders)
      //  .targetField(RESOURCE_TARGET_FIELD),
      //nga.field('receivers', 'referenced_many')
      //  .targetEntity(receivers)
      //  .targetField(RESOURCE_TARGET_FIELD),
      nga.field('controls', 'json'),
      horizontalRuleField(),
      nga.field('sources', 'referenced_list')
        .targetEntity(sources)
        .targetReferenceField('device_id')
        .targetFields([RESOURCE_TARGET_FIELD]),
      nga.field('senders', 'referenced_list')
        .targetEntity(senders)
        .targetReferenceField('device_id')
        .targetFields([RESOURCE_TARGET_FIELD]),
      nga.field('receivers', 'referenced_list')
        .targetEntity(receivers)
        .targetReferenceField('device_id')
        .targetFields([RESOURCE_TARGET_FIELD])
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(devices);

  // Sources list view

  sources.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices()
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('description')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Source show view

  sources.showView()
    .title(resourceTitleTemplate('Source'))
    .fields([
      resourceCoreFields(),
      nga.field('grain_rate', 'json').template(RATIONAL_VALUE_TEMPLATE),
      nga.field('caps', 'json').label('Capabilities'), // (not yet defined)
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Device'),
      nga.field('parents', 'reference_many') // TODO: format this like a 'referenced_list'
        .targetEntity(sources)
        .targetField(RESOURCE_TARGET_FIELD),
      nga.field('clock_name'),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('channels', 'json').template(showItemTemplate('urn:x-nmos:format:audio'), true),
      horizontalRuleField(),
      nga.field('flows', 'referenced_list')
        .targetEntity(flows)
        .targetReferenceField('source_id')
        .targetFields([RESOURCE_TARGET_FIELD])
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(sources);

  // Flows list view

  flows.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices(FORMAT_CHOICES)
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('description')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Flow show view

  flows.showView()
    .title(resourceTitleTemplate('Flow'))
    .fields([
      resourceCoreFields(),
      nga.field('grain_rate', 'json').template(RATIONAL_VALUE_TEMPLATE),
      nga.field('source_id', 'reference')
        .targetEntity(sources)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Source'),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Device'),
      nga.field('parents', 'reference_many')
        .targetEntity(flows)
        .targetField(RESOURCE_TARGET_FIELD),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('media_type'),
      // flow_audio.json
      nga.field('sample_rate', 'json').template(showStringItemTemplate(RATIONAL_VALUE_EXPRESSION, 'urn:x-nmos:format:audio'), true),
      // flow_audio_raw.json
      nga.field('bit_depth').template(showItemTemplate('urn:x-nmos:format:audio'), true),
      // flow_sdianc_data.json
      nga.field('DID_SDID', 'json').template(showItemTemplate('urn:x-nmos:format:data', 'video/smpte291'), true),
      // flow_video.json
      nga.field('frame_width').template(showItemTemplate('urn:x-nmos:format:video'), true),
      nga.field('frame_height').template(showItemTemplate('urn:x-nmos:format:video'), true),
      nga.field('interlace_mode', 'choice').choices(INTERLACE_MODE_CHOICES).template(showItemTemplate('urn:x-nmos:format:video'), true),
      nga.field('colorspace', 'choice').choices(COLORSPACE_CHOICES).template(showItemTemplate('urn:x-nmos:format:video'), true),
      nga.field('transfer_characteristic', 'choice').choices(TRANSFER_CHARACTERISTIC_CHOICES).template(showItemTemplate('urn:x-nmos:format:video'), true),
      // flow_video_raw.json
      nga.field('components', 'json').template(showItemTemplate('urn:x-nmos:format:video', 'video/raw'), true),
      horizontalRuleField(),
      nga.field('senders', 'referenced_list')
        .targetEntity(senders)
        .targetReferenceField('flow_id')
        .targetFields([RESOURCE_TARGET_FIELD])
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(flows);

  // Senders list view

  senders.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('transport', 'choice').sortable(false).choices(TRANSPORT_CHOICES)
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('transport')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('description')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Sender show view

  senders.showView()
    .title(resourceTitleTemplate('Sender'))
    .fields([
      resourceCoreFields(),
      nga.field('caps', 'json').label('Capabilities'), // being added in v1.2
      nga.field('flow_id', 'reference')
        .targetEntity(flows)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Flow'),
      nga.field('transport', 'choice').choices(TRANSPORT_CHOICES),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Device'),
      nga.field('manifest_href').template(URL_VALUE_TEMPLATE).label('Manifest Address'),
      nga.field('interface_bindings', 'json') // being added in v1.2
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(senders);

  // Receiver list view

  receivers.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices(FORMAT_CHOICES),
      nga.field('transport', 'choice').sortable(false).choices(TRANSPORT_CHOICES),
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('transport')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('description')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Receiver show view

  const CONNECT_TEMPLATE =
    '<div class="input-group">' +
      // would like to have an ma-reference-field which is what is used for the editionView
      // but I haven't been able to work out how to populate the choices in the showView :-(
      //'<ma-reference-field entry="entry" field="::field" value="value" datastore="::datastore"/>' +
      '<ma-connect-field entry="entry" field="::field" value="value" datastore="::datastore"/>' +
      '<span class="input-group-btn" style="padding-left: 12px"><ma-connect-button entry="entry" value="value" datastore="::datastore" label-connect="Connect" label-disconnect="Disconnect"/></span>' +
    '</div>';

  // duplicate entity required due to ng-admin bug, e.g. https://github.com/marmelab/ng-admin/issues/1207
  var targets = nga.entity('senders').readOnly();

  receivers.showView()
    .prepare(['entry', 'Restangular', 'datastore', function(entry, Restangular, datastore) {
      // make sure we're using the right base URL (receivers, senders, flows, devices, and nodes shouldn't all have different baseApiUrl() so just use admin, the app)
      var adminRestangular = Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl(admin.baseApiUrl());
      });
      // have to perform a kind of 'join' to find Senders that have both a transport matching this Receiver and a Flow with a matching format
      adminRestangular.all('senders').getList({ _filters: { transport: entry.values.transport } }).then((senders) => {
      // if transport is "urn:x-nmos:transport:rtp" need to get and merge Senders with the ".mcast" and ".ucast" variants
        senders.data.map(sender => {
          adminRestangular.one('flows', sender.flow_id).get().then((flow) => {
            if (flow.data.format.startsWith(entry.values.format)) {
              datastore.addEntry('targets', sender);
              datastore.addEntry(targets.uniqueId + '_choices', { value: sender.id, label: sender.label });
            }
          });
        });
      });
      adminRestangular.one('devices', entry.values.device_id).get().then((device) => {
        adminRestangular.one('nodes', device.data.node_id).get().then((node) => {
          // should use the node api version here
          datastore.addEntry('target_href', node.data.href + ('/' === node.data.href.substr(-1) ? '' : '/') + 'x-nmos/node/v1.0/receivers/' + entry.values.id + '/target');

          var conman = device.data.controls.find((control) => { return "urn:x-nmos:control:sr-ctrl/v1.0" === control.type; });
          if (undefined !== conman) {
            datastore.addEntry('conman_href', conman.href + ('/' === conman.href.substr(-1) ? '' : '/') + 'single/receivers/' + entry.values.id + '/');
          }
        });
      });
    }])
    .title(resourceTitleTemplate('Receiver'))
    .fields([
      resourceCoreFields(),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Device'),
      nga.field('transport', 'choice').choices(TRANSPORT_CHOICES),
      nga.field('interface_bindings', 'json'), // being added in v1.2
      nga.field('subscription.sender_id', 'reference')
        .targetEntity(senders)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Sender')
        .template('<span ng-if="null == value">Disconnected</span><ma-reference-link-column ng-if="null != value" entry="::entry" field="::field" value="::value" datastore="::datastore" class="ng-scope ng-isolate-scope"/>'),
      nga.field('subscription.sender_id.target', 'reference')
        .targetEntity(targets)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('')
        .remoteComplete(true, { refreshDelay: 300 })
        .attributes({ placeholder: 'Select a Sender to connect...' })
        .template(CONNECT_TEMPLATE),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('caps', 'json').label('Capabilities')
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(receivers);

  // Subscriptions list view

  subscriptions.listView()
    .fields([
      nga.field('resource_path').isDetailLink(true).sortable(false),
      nga.field('persist', 'boolean').sortable(false),
      nga.field('max_update_rate_ms', 'number').label('Max Update Rate (ms)').sortable(false),
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
    .filters([
      nga.field('resource_path').label('Resource Path')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('persist', 'boolean')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('max_update_rate_ms', 'number').label('Max Update Rate (ms)')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Subscription show view

  subscriptions.showView()
    .title('Subscription: {{entry.values.resource_path}}')
    .fields([
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('ws_href').template(URL_VALUE_TEMPLATE).label('WebSocket Address'),
      nga.field('max_update_rate_ms', 'number').label('Max Update Rate (ms)'),
      nga.field('persist', 'boolean'),
      nga.field('secure', 'boolean'), // added in v1.1
      nga.field('resource_path'),
      nga.field('params', 'json')
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(subscriptions);

  // Logs list view

  function levelCssClasses(entry) {
    if (entry) {
      return entry.values.level > 10 ? 'level-error' : entry.values.level > 0 ? 'level-warning' : entry.values.level < 0 ? 'level-verbose' : '';
    }
    return '';
  };

  logs.listView()
    .fields([
      nga.field('timestamp', 'datetime').isDetailLink(true).sortable(false),
      nga.field('level_name').label('Level').isDetailLink(true).sortable(false)
        .cssClasses(levelCssClasses),
      nga.field('message').sortable(false).map(function truncate(value) {
        if (!value) return '';
        return value.length > 80 ? value.substr(0, 80) + '...' : value;
      }),
      nga.field('route_parameters.api').label('API').sortable(false)
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
    .filters([
      nga.field('timestamp')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('level_name')
        .label('Level')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('message')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('route_parameters.api')
        .label('API')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('route_parameters.resourceType')
        .label('Resource Type')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Log show view

  logs.showView()
    .title('Log: {{entry.values.level_name}} @ {{entry.values.timestamp}}')
    .fields([
      nga.field('timestamp', 'datetime'),
      nga.field('level_name').label('Level')
        .cssClasses(function(entry) {
          return 'col-sm-10 col-md-8 col-lg-7 ' + levelCssClasses(entry);
        }),
      nga.field('message'),
      nga.field('route_parameters.api').label('API'),
      nga.field('route_parameters.resourceType').label('Resource Type'),
      nga.field('route_parameters.resourceId').label('Resource ID'),
      nga.field('http_method').label('HTTP Method'),
      nga.field('request_uri').label('Request URI'),
      nga.field('source_location', 'json'),
      nga.field('thread_id').label('Thread ID'),
      nga.field('id').isDetailLink(false).label('ID')
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(logs);

  // Dashboard

  admin.dashboard(nga.dashboard()
    .addCollection(nga.collection(nodes).fields(nodes.listView().fields()))
    .addCollection(nga.collection(devices).fields(devices.listView().fields()))
    .addCollection(nga.collection(sources).fields(sources.listView().fields()))
    .addCollection(nga.collection(flows).fields(flows.listView().fields()))
    .addCollection(nga.collection(senders).fields(senders.listView().fields()))
    .addCollection(nga.collection(receivers).fields(receivers.listView().fields()))
    .addCollection(nga.collection(subscriptions).fields(subscriptions.listView().fields()))
    //.addCollection(nga.collection(logs).fields(logs.listView().fields()).perPage(10))
  );

  // Side-bar menu

  admin.menu(nga.menu()
    .addChild(nga.menu(nodes).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(devices).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(sources).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(flows).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(senders).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(receivers).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(subscriptions).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(logs).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu()
      .icon('<span class="glyphicon glyphicon-cog"></span>')
      .title('Settings')
      .link('/settings')
      .active(function(path) {
        return path.indexOf('/settings') === 0;
      }))
  );

  // attach the admin application to the DOM and execute it
  nga.configure(admin);
}]);

// Custom 'Settings' page (and initial run-time configuration)

myApp.run(['NgAdminConfiguration', '$userSettings', function (NgAdminConfiguration, $userSettings) {
  var queryUrl = $userSettings.get('queryUrl');
  if (queryUrl) {
    NgAdminConfiguration().baseApiUrl(queryUrl);
  }
}]);

function settingsController($scope, NgAdminConfiguration, $stateParams, notification, $userSettings) {
  // notification is the service used to display notifications on the top of the screen
  this.config = NgAdminConfiguration;
  this.address = this.config().baseApiUrl();
  this.notification = notification;
  this.userSettings = $userSettings;
};
settingsController.prototype.save = function() {
  this.notification.log('Saving settings');
  this.config().baseApiUrl(this.address);
  this.userSettings.set('queryUrl', this.address);
};
settingsController.inject = ['NgAdminConfiguration', '$stateParams', 'notification', '$userSettings'];

var settingsControllerTemplate =
  '<div class="row"><div class="col-lg-12"><div class="page-header">' +
    '<ma-view-actions><ma-back-button></ma-back-button></ma-view-actions>' +
    '<h1>Settings</h1>' +
  '</div></div></div>' +

  '<form class="form-horizontal" ng-submit="controller.save()">' +

    '<div>' +
      '<div class="form-field form-group">' +
        '<label class="col-sm-2 control-label">Query API</label>' +
        '<div class="ng-admin-type-string col-sm-10 col-md-8 col-lg-7">' +
          '<input type="text" ng-model="controller.address" class="form-control"/>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="form-group"><div class="col-sm-offset-2 col-sm-10"><ma-submit-button label="SAVE_CHANGES" class="ng-isolate-scope"><button type="submit" class="btn btn-primary"><span class="glyphicon glyphicon-ok"></span>&nbsp;<span class="hidden-xs ng-scope" translate="SAVE_CHANGES">Save changes</span></button></ma-submit-button></div></div>' +

  '</form>';

myApp.config(function ($stateProvider) {
  $stateProvider.state('settings', {
    parent: 'ng-admin',
    url: '/settings',
    params: { id: null },
    controller: settingsController,
    controllerAs: 'controller',
    template: settingsControllerTemplate
  });
});

// Custom directives to select and connect a Receiver to a Sender

// relies on field misusing 'reference' type and remoteComplete('true') so that the choice field actually refreshes...
myApp.directive('maConnectField', [function () {
  return {
    restrict: 'E',
    scope: {
      entry: '=?',
      field: '&',
      value: '=',
      datastore: '&?'
    },
    link: function (scope, element, attrs) {
      var field = scope.field();
      var initialChoices = scope.datastore().getEntries(field.targetEntity().uniqueId + '_choices');
      scope.$broadcast('choices:update', { choices: initialChoices });
      scope.refresh = function refresh() {
        var refreshedChoices = scope.datastore().getEntries(field.targetEntity().uniqueId + '_choices');
        scope.$broadcast('choices:update', { choices: refreshedChoices });
      };
    },
    template: '<ma-choice-field field="::field()" value="value" datastore="datastore()" refresh="refresh()"/>'
  };
}]);

// relies on 'target_href' and 'targets' being in the datastore
// could potentially use Restangular to make the request? and use the ng-admin HttpErrorService?
myApp.directive('maConnectButton', ['$http', '$state', 'notification', function ($http, $state, notification) {
  return {
    restrict: 'E',
    scope: {
      entry: '&',
      value: '=',
      datastore: '&',
      size: '@',
      labelConnect: '@',
      labelDisconnect: '@'
    },
    link: function (scope, element, attrs) {
      scope.labelConnect = scope.labelConnect || 'CONNECT';
      scope.labelDisconnect = scope.labelDisconnect || 'DISCONNECT';
      scope.connect = function () {
        var conman_href = scope.datastore().getFirstEntry('conman_href');
        var target_href = scope.datastore().getFirstEntry('target_href');
        var sender = scope.datastore().getEntries('targets').find(sender => { return sender.id === scope.value; });

        var connect;

        if (null == conman_href) {
          console.log("Using Node API /target");
          connect = $http.put(target_href, null == sender ? {} : sender);
        }
        else {
          console.log("Using Connection Management API");
          if (null == sender) {
            // disconnect
            connect = $http.patch(conman_href + 'staged/transportparams', {
                transport_params: [
                  { rtp_enabled: false } // one entry per 'leg' for ST2022-7 (discover from interface_bindings on the receiver)
                ],
                sender_id: null
              });
/*
            connect = $http.put(conman_href + 'staged/transportfile', {
                session_description: { // session_description becomes transport_file soon
                  data: null,
                  type: "application/sdp",
                  by_reference: false
                },
                // other possibilities for disconnect...
                //session_description: { data: null },
                //session_description: {},
                //session_description: null,
                sender_id: null
              });
*/
/*
            connect = $http.put(conman_href + 'staged/transportfile', {});
*/
          }
          else {
            // connect
            connect = $http.put(conman_href + 'staged/transportfile', {
                session_description: { // session_description becomes transport_file soon
                  data: sender.manifest_href,
                  type: "application/sdp",
                  by_reference: true
                },
                sender_id: sender.id
              });
          }
          connect = connect.then(() => {
              return $http.post(conman_href + 'activate', { mode: "activate_immediate" });
            });
        }

        connect.then(
            () => { $state.reload(); },
            (error) => { notification.log(error.data.error, { addnCls: 'humane-flatty-error' }); }
          );
      };
    },
    template:
      '<a class="btn btn-default" ng-class="size ? \'btn-\' + size : \'\'" ng-click="connect()">' +
        '<span class="glyphicon {{0 < value.length ? \'glyphicon-ok\' : \'glyphicon-remove\'}}" aria-hidden="true"></span>' +
        '&nbsp;' +
        '<span class="hidden-xs" translate="{{0 < value.length ? labelConnect : labelDisconnect}}"></span>' +
      '</a>'
  };
}]);

// Custom reload button

myApp.directive('maReloadButton', ['$state', function ($state) {
  return {
    restrict: 'E',
    scope: {
      size: '@',
      label: '@'
    },
    link: function (scope, element, attrs) {
      scope.label = scope.label || 'RELOAD';
      scope.reload = function () {
        $state.reload();
      };
    },
    template:
      '<a class="btn btn-default" ng-class="size ? \'btn-\' + size : \'\'" ng-click="reload()">' +
        '<span class="glyphicon glyphicon-repeat" aria-hidden="true"></span>' +
        '&nbsp;' +
        '<span class="hidden-xs" translate="{{label}}"></span>' +
      '</a>'
  };
}]);

// Intercept ng-admin REST flavour and adapt for NMOS flavour

myApp.config(['RestangularProvider', function (RestangularProvider) {
  RestangularProvider.addFullRequestInterceptor(function (element, operation, what, url, headers, params) {
    if (operation === 'getList') {
      // Pagination
      if (what === 'events') {
        params['paging.offset'] = (params._page - 1) * params._perPage;
        params['paging.limit'] = params._perPage;
      }
      delete params._page;
      delete params._perPage;
      // Sorting
      delete params._sortField;
      delete params._sortDir;
      // Query parameters
      if (params._filters) {
        if (what != 'events') params['query.match_type'] = 'substr,icase';  // sea-lion private parameter to allow partial match functionality
        for (var filter in params._filters) {
          params[filter] = params._filters[filter];
        }
        delete params._filters;
      }
    }
    return { params: params };
  });
}]);

// Use NMOS error response body

const HttpErrorDecorator = ($delegate, $translate, notification) => {
  $delegate.errorMessage = error => {
    return {
      message: undefined === error.data ? '' :
        error.data.error + ' (' + error.data.code + ')'
        + (error.data.debug ? '<br/>' + error.data.debug : '')
    };
  };

  $delegate.handle403Error = error => {
    $translate('STATE_FORBIDDEN_ERROR', $delegate.errorMessage(error)).then($delegate.displayError);
    throw error;
  };

  $delegate.handleDefaultError = error => {
    $translate('STATE_CHANGE_ERROR', $delegate.errorMessage(error)).then($delegate.displayError);
    throw error;
  };

  return $delegate;
}

HttpErrorDecorator.$inject = ['$delegate', '$translate', 'notification'];
myApp.decorator('HttpErrorService', HttpErrorDecorator);
