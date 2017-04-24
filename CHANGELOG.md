# Changelog

## Last Changes

- [#57](https://github.com/LaxarJS/laxar-mocks/issues/57): documentation: fixed broken link


## v2.0.0-rc.0

- [#56](https://github.com/LaxarJS/laxar-mocks/issues/56): use laxar-infrastructure, upgrade to latest laxar and laxar-tooling


## v2.0.0-beta.4

- [#55](https://github.com/LaxarJS/laxar-mocks/issues/55): adjusted to LaxarJS/laxar#447
- [#54](https://github.com/LaxarJS/laxar-mocks/issues/54): removed misleading comment regarding promise-patching


## v2.0.0-beta.3

- [#53](https://github.com/LaxarJS/laxar-mocks/issues/53): adapted to the new LaxarJS bootstrapping API (LaxarJS/laxar#437)
- [#52](https://github.com/LaxarJS/laxar-mocks/issues/52): tearDown: complain if `done` callback is missing
    + NEW FEATURE: see ticket for details


## v2.0.0-beta.2

- [#48](https://github.com/LaxarJS/laxar-mocks/issues/48): removed initial `didChangeTheme` event
    + **BREAKING CHANGE:** see ticket for details
- [#49](https://github.com/LaxarJS/laxar-mocks/issues/49): event bus error details are now forwarded to the console
    + NEW FEATURE: see ticket for details
- [#47](https://github.com/LaxarJS/laxar-mocks/issues/47): project: `laxar-widget-service-mocks` have been removed from the bundle


## v2.0.0-beta.1

- [#46](https://github.com/LaxarJS/laxar-mocks/issues/46): pass spec fixtures using the `init` method
    + **BREAKING CHANGE:** see ticket for details
- [#45](https://github.com/LaxarJS/laxar-mocks/issues/45): publish `endLifecycleRequest` on tearDown
    + **BREAKING CHANGE:** see ticket for details


## v2.0.0-beta.0

- [#44](https://github.com/LaxarJS/laxar-mocks/issues/44): eventBus: added error handler
- [#43](https://github.com/LaxarJS/laxar-mocks/issues/43): fixed line numbers in spec-loader output
- [#40](https://github.com/LaxarJS/laxar-mocks/issues/40): updated manual for v2.0.0


## v2.0.0-alpha.3

- [#31](https://github.com/LaxarJS/laxar-mocks/issues/31): added `axMocks.widget.whenServicesAvailable` to intercept and configure widget injections from tests
    + NEW FEATURE: see ticket for details
- [#42](https://github.com/LaxarJS/laxar-mocks/issues/42): fixed injection of visibility mock
- [#41](https://github.com/LaxarJS/laxar-mocks/issues/41): new `setupForWidget` API, deprecated `createSetupForWidget`
    + **BREAKING CHANGE:** see ticket for details


## v2.0.0-alpha.2

- [#39](https://github.com/LaxarJS/laxar-mocks/issues/39): added "browser" target to `package.json`
- [#38](https://github.com/LaxarJS/laxar-mocks/issues/38): fixed reporting of AJV validation errors


## v2.0.0-alpha.1

- [#37](https://github.com/LaxarJS/laxar-mocks/issues/37): adapted to laxar API change (LaxarJS/laxar#413)
- [#35](https://github.com/LaxarJS/laxar-mocks/issues/35): project: updated dev-dependencies, upgraded to webpack 2
- [#33](https://github.com/LaxarJS/laxar-mocks/issues/33): features: validate widget features at runtime
- [#34](https://github.com/LaxarJS/laxar-mocks/issues/34): services: a mocked area helper service can now be injected
- [#32](https://github.com/LaxarJS/laxar-mocks/issues/32): adapters with asynchronous create method are now supported
- [#28](https://github.com/LaxarJS/laxar-mocks/issues/28): fixed mock injections for axAssets and axConfiguration
- [#27](https://github.com/LaxarJS/laxar-mocks/issues/27): updated for LaxarJS v2.0 compatibility (laxar#358)


## v2.0.0-alpha.0

- [#26](https://github.com/LaxarJS/laxar-mocks/issues/26): updated for LaxarJS v2.0 compatibility
    + **BREAKING CHANGE:** see ticket for details
- [#24](https://github.com/LaxarJS/laxar-mocks/issues/24): documentation: added missing information on the widget ID


## v1.0.0

- [#23](https://github.com/LaxarJS/laxar-mocks/issues/23): project: updated copyright year in file header


## v1.0.0-alpha.1

- [#21](https://github.com/LaxarJS/laxar-mocks/issues/21): respect flush/applyViewChanges interaction


## v1.0.0-alpha.0

- [#17](https://github.com/LaxarJS/laxar-mocks/issues/17): added missing API doc entries
- [#19](https://github.com/LaxarJS/laxar-mocks/issues/19): allowed adding `flush()` method to `ax.fn.debounce` results
- [#20](https://github.com/LaxarJS/laxar-mocks/issues/20): added mock promise factory support for `laxar._tooling.provideQ`
- [#18](https://github.com/LaxarJS/laxar-mocks/issues/18): eventBus: made mock use correct promise factory


## v0.6.0

- [#16](https://github.com/LaxarJS/laxar-mocks/issues/16): fixed optionality of options in createSetupForWidget


## v0.5.0

- [#15](https://github.com/LaxarJS/laxar-mocks/issues/15): allow custom technology adapters
- [#14](https://github.com/LaxarJS/laxar-mocks/issues/14): pass axControls to widget loader


## v0.4.0

- [#12](https://github.com/LaxarJS/laxar-mocks/issues/12): adapters: adjust to changes in LaxarJS tooling API
- [#13](https://github.com/LaxarJS/laxar-mocks/issues/13): project: renamed to laxar-mocks
- [#11](https://github.com/LaxarJS/laxar-mocks/issues/11): example: fixed one-off bug in HTML spec-runner
- [#9](https://github.com/LaxarJS/laxar-mocks/issues/9): example: spec-runner now takes URL parameter for config-lookup
    + NEW FEATURE: see ticket for details
- [#7](https://github.com/LaxarJS/laxar-mocks/issues/7): example: fixed license header of spec-runner config


## v0.3.0

- [#6](https://github.com/LaxarJS/laxar-mocks/issues/6): use different paths to access jasmine and jasmine2, use opt-in config for new test-runner
    + **BREAKING CHANGE:** see ticket for details
- [#7](https://github.com/LaxarJS/laxar-mocks/issues/7): project: relaxed version constraint for angular-mocks (1.3.16 -> ~1.3.17 || ~1.4.2)
- [#8](https://github.com/LaxarJS/laxar-mocks/issues/8): fixed example boot sequence (removed jasmine boot)
- [#5](https://github.com/LaxarJS/laxar-mocks/issues/5): added Travis-CI build integration
    + NEW FEATURE: see ticket for details
- [#4](https://github.com/LaxarJS/laxar-mocks/issues/4): Fixed dependency to Jasmine
- [#3](https://github.com/LaxarJS/laxar-mocks/issues/3): Fixed construction of test paths for RequireJS


## v0.2.0

- [#1](https://github.com/LaxarJS/laxar-mocks/issues/1): added some tests


## v0.1.0
