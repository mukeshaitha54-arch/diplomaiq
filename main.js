require.config({
    waitSeconds: 90,
    packages: [{
        name: 'moment',
        // This location is relative to baseUrl. Choose bower_components
        // or node_modules, depending on how moment was installed.
        location: '/scripts/',
        main: 'moment'
    }],
    paths: {
        'jQuery': '/scripts/jquery-3.3.1.min',
        'bootstrap': '/scripts/bootstrap.min',
        'angular': '/scripts/angular.min',
        'angularroute': '/scripts/angular-route.min',
        'angularuiroute': '/scripts/angular-ui-router',
        'localstorage': '/scripts/ngStorage',
        'spin': "/scripts/spinner/spin.min",
        'angularspinner': "/scripts/spinner/angular-spinner.min",
        'angularloadingspinner': "/scripts/spinner/angular-loading-spinner",
        'authInterceptorService': '/app/services/authInterceptorService',
        'underscorejs': "/scripts/underscorejs",
        'pdfmakejs': "/scripts/pdfmake",
        'html2canvasjs': "/scripts/html2canvas.min",
        'angularUtils.directives.dirPagination': "/scripts/dirPagination",
        'AppSettings': '/app/services/AppSettings',
        'DataAccessService': '/app/services/DataAccessService',
        'uibootstraptpls': '/scripts/ui-bootstrap-tpls',      
        'datetimepicker': '/scripts/datetime-picker',
        'jqueryuidate': '/scripts/date',
       // 'jqueryui': '/scripts/jquery-ui',
        'angular-crypto': '/scripts/angularjs-crypto',
        'cryptojs': '/scripts/CryptoJSCipher',
        'aes': '/scripts/aes',
        'pbkdf2': '/scripts/pbkdf2-min'

        // 'toaster': "/scripts/toaster.min"
    },
    shim: {
        'jQuery': { exports: '$' },
        //'toaster': { exports: ["toaster"] },
      //  'jqueryui': { exports: ["jqueryui"] },
        'angular': { exports: "angular" },
        'angularroute': { deps: ["angular"] },
        'angularuiroute': { deps: ["angular"] },
        'localstorage': { deps: ["angularroute"] },
        'bootstrap': { deps: ["jQuery"] },
        'angularspinner': { deps: ["angular"] },
        'angularloadingspinner': { deps: ["angular"] },
        'underscorejs': { deps: ["angular"] },
        'angularUtils.directives.dirPagination': { deps: ["angular"] },
        'uibootstraptpls': { deps: ["jQuery", "angular"] },
        'jqueryuidate': { deps: ["jQuery"] },
        'datetimepicker': { deps: ["uibootstraptpls"] },
        'angular-crypto': { deps: ["angular"] },
        'cryptojs': { deps: ["angular", "angular-crypto"] },
        'aes': { deps: ["cryptojs"] },
        'pbkdf2': { deps: ["cryptojs"] },

        // 'toaster': { deps: ["jQuery", "angular"] }

    },
    deps: ['app']
});

require
    (
        [
            'jQuery',
            'moment',
            'jqueryuidate',
            'app',
            'angular',
            'angularroute',
            'angularuiroute',
            'localstorage',
            'uibootstraptpls',
            'datetimepicker',           
            'spin',
            'angularspinner',
            'angularloadingspinner',
            'authInterceptorService',
            'AppSettings',
            'DataAccessService',
            'underscorejs',
            'angularUtils.directives.dirPagination',
            'bootstrap',
            'angular-crypto',
            //'cryptojs',
            //'aes',
            //'pbkdf2'
            // 'toaster'
        ],
        function () {
            angular.bootstrap(document, ['app']);
        }
    );