define(['AdmissionRoutes', 'services/routeResolver', 'angularroute', 'jqueryuidate', 'uibootstraptpls', 'moment'], function (config, routeResolver) { //,'angular-animate''datetimepicker',
    var app = angular.module('app', ['ui.router', 'ngLoadingSpinner', 'ngStorage', 'ui.bootstrap', 'ui.bootstrap.datetimepicker', 'angularjs-crypto']); //,'ngAnimate','uiCropper'
    app.config(
        [
            '$stateProvider',
            '$urlRouterProvider',
            '$locationProvider',
            '$controllerProvider',
            '$compileProvider',
            '$filterProvider',
            '$provide',
            function ($stateProvider, $urlRouterProvider, $locationProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {
                app.controller = $controllerProvider.register;
                app.directive = $compileProvider.directive;
                app.filter = $filterProvider.register;
                app.factory = $provide.factory;
                app.service = $provide.service;
                if (config.routes !== undefined) {
                    angular.forEach(config.routes, function (route, path) {
                        $stateProvider.state(path, { url: route.url, templateUrl: route.templateUrl, resolve: routeResolver(route.dependencies) });
                    });

                }
                //$provide.errorOnUnhandledRejections(false);
                //$locationProvider.hashPrefix('');             
                //$locationProvider.html5Mode({                 
                //    enabled: true,                            
                //    requireBase: false                        
                //});

                if (config.defaultRoutePaths !== undefined) {
                    $urlRouterProvider.otherwise(config.defaultRoutePaths);
                }
                app.compileProvider = $compileProvider;
            }
        ]);



    app.factory('beforeUnload', function ($rootScope, $window) {
        $window.onbeforeunload = function (e) {
            var confirmation = {};
            var event = $rootScope.$broadcast('onBeforeUnload', confirmation);
            if (event.defaultPrevented) {
                return confirmation.message;
            }
        };
        $window.onunload = function () {
            $rootScope.$broadcast('onUnload');
        };
        return {};
    })

    //app.factory('clearCache', function ($cacheFactory) {
    //    $cacheFactory.destroy();, beforeUnload
    //})

    app.run(function ($rootScope, $state, $location, $localStorage, $window, $http, $document) {
        var WebApiUrl = '/API/';
        var d = new Date();
        var n = d.getTime();  //n in ms

        $rootScope.idleEndTime = n + (15 * 60 * 1000); //set end time to 10 min from now
        $document.find('body').on('mousemove keydown DOMMouseScroll mousewheel mousedown touchstart', checkAndResetIdle); //monitor events
        //if (authData == undefined) {
        //    $state.go('login');

        //};

        //$rootScope.$on('$stateChangeError',
        //    function (event, toState, toParams, fromState, fromParams, error) {
        //        console.log(event);
        //    })

        //   console.log(window.location)
        var url = window.location.href
        var hash = window.location.pathname

        var allowedRedirects = ["/index.html"];

        //function redirectUser(url) {
            if (allowedRedirects.includes(hash)) {
               // window.location.href = url;
                console.log("Authorized")
            } else {
                console.error("Unauthorized redirect attempt");
            }
       // }
        
        function checkAndResetIdle() //user did something
        {
            var d = new Date();
            var n = d.getTime();  //n in ms


            if (n > $rootScope.idleEndTime) {
                $document.find('body').off('mousemove keydown DOMMouseScroll mousewheel mousedown touchstart'); //un-monitor events
                // var data = {"userName": $localStorage.authorizationData.userName};
                // alert('Session ended due to inactivity');
                //var request = {
                //    method: 'POST',
                //    url: WebApiUrl + "/api/SystemUser/PostLogoutLog",
                //    data: data,
                //    headers: {
                //        'Content-Type': 'application/json'
                //    }
                //};
                //$http(request).then(function (d) {                                           
                //},function (err) {                     
                //    let error = JSON.parse(err);
                //    alert(error.message);
                //});
                // $state.go('login');
                //  $rootScope.$apply();
            }
            else {
                $rootScope.idleEndTime = n + (10 * 60 * 1000); //reset end time
            }
        }
        app.config(function ($httpProvider) {
            $httpProvider.interceptors.push('authInterceptorService');
        })
        window.moment = require('moment');
        //angular.element($window).bind('resize', function () {
        //    for (i = 1; i <= $(".e-grid").length; i++) {
        //        var childid = $(".e-grid").eq(i - 1).attr('id');
        //        var gridobj = $("#" + childid).ejGrid("instance")
        //        var gridHight = gridobj.element.parent().innerHeight();
        //        if (gridHight > $window.innerHeight) {
        //            gridHight = $window.innerHeight
        //        }
        //        gridobj.setDimension(gridHight - 100, gridobj.element.parent().innerWidth() - 30);
        //        gridobj.getContent().ejScroller("refresh");
        //    }
        //    $rootScope.windowWidth = $window.outerWidth;
        //    $rootScope.$apply('windowWidth');
        //});
        if (sessionStorage.loggedIn == undefined) {
            delete $localStorage.authorizationData;
            sessionStorage.loggedIn = "no";
        }
        else if (sessionStorage.loggedIn == "no") {
            delete $localStorage.authorizationData;
        }
        var authData = $localStorage.authorizationData;
        if (authData == undefined) {
            //$state.transitionTo("login", null, { notify: true });
            //  $state.go('login');
            $state.go('index');
            //$state.go('StudentResult');
        };

        $rootScope.$on('logout', function (event, data) {
            var data = { "userName": data !== null ? data : $localStorage.authorizationData.userName };
            $localStorage.$reset();
            var request = {
                method: 'POST',
                url: WebApiUrl + "/api/SystemUser/PostLogoutLog",
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            $http(request).then(function (d) {
            }, function (err) {
                let error = JSON.parse(err);
                alert(error.message);
            });
            $state.go('login');
        });

        //$rootScope.$on('$viewContentLoading', function (event, toState, toParams, fromState, fromParams) {
        //    console.log(event);
        //});

        //$rootScope.$on('$locationChangeStart', function (event, toState, toParams, fromState, fromParams) {
        //   console.log(event);
        //});

        $state.defaultErrorHandler(function () {
            // console.log('Default error handler fired!');
        });




        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            console.log(event);
            //var WebApiUrl = 'http://testapi.hebeon.com/';
            var WebApiUrl = '/api/';
            //var WebApiUrl = http://sbptest.hebeon.com/API/;
            var authData = $localStorage.authorizationData;
            //if ((sessionStorage.loggedIn == "no" || authData == undefined) && toState.name != 'login' && toState.name !== 'ForgetPassword' && toState.name !== 'ForgetPasswordSaved' && toState.name !== 'GovtColEnroll' && toState.name !== 'GovtColEnrollExist' && toState.name !== 'GovtColEnrollList' && toState.name !== 'ReportViewer1Controller' && (toState.name.indexOf("StudentOnlineRequest") != 0)) {
            if ((authData == undefined) && toState.name != 'login' && toState.name !== 'Components' && toState.name !== 'ForgetPassword' && toState.name !== 'ForgetPasswordSaved' && toState.name !== 'GovtColEnroll' && toState.name !== 'GovtColEnrollExist' && toState.name !== 'GovtColEnrollList' && toState.name !== 'ReportViewer1Controller' && toState.name !== 'StudentResult' && toState.name !== 'ComingSoon' && (toState.name.indexOf("StudentOnlineRequest") != 0)) {
                event.preventDefault();
                $state.transitionTo("login", null, { notify: false });
                $state.go('login');

                return;
            }
            if (authData) {
                config.headers.Authorization = $localStorage.authToken;
            }

            if (toState.name.indexOf("Exam") == 0) {
                if (toState.name != 'Exam' && toState.name != 'login') {
                    var UsersRightsdata = [];
                    UsersRightsdata = $localStorage.authorizationData.UserRights;
                    for (var i = 0; i < UsersRightsdata.length; i++) {
                        var PrName = 'Exam.' + UsersRightsdata[i].GridFormToOpen;
                        if (PrName == toState.name) {
                            if ((UsersRightsdata[i].isaddable != 'Y') && (UsersRightsdata[i].isupdatable != 'Y') && (UsersRightsdata[i].isdeletable != 'Y') && (UsersRightsdata[i].isprintable != 'Y')) {
                                event.preventDefault();
                                $state.transitionTo("Exam", null, { notify: false });
                                $state.go('Exam');
                            }
                            else {
                                var request = {
                                    method: 'GET',
                                    url: WebApiUrl + "/api/SystemUser/GetUpdateSystemUserLog/?xFrmString=" + UsersRightsdata[i].SysProgName + "&xFrmProgramID=" + UsersRightsdata[i].SysProgID + "&xFrmOpenedByUserID=" + $localStorage.authorizationData.SysUserID + "",
                                    data: '',
                                    headers: {
                                        'Content-Type': undefined
                                    }
                                };
                                $http(request)
                                    .success(function (d) {
                                        alert("yes");
                                    })
                                    .error(function () {
                                    });
                            }
                        }
                    }
                }
            } else if (toState.name.indexOf("Masters") == 0) {
                if (toState.name != 'Masters' && toState.name != 'login') {
                    var UsersRightsdata = [];
                    UsersRightsdata = $localStorage.authorizationData.UserRights;
                    for (var i = 0; i < UsersRightsdata.length; i++) {
                        var PrName = 'Masters.' + UsersRightsdata[i].GridFormToOpen;
                        if (PrName == toState.name) {
                            if ((UsersRightsdata[i].isaddable != 'Y') && (UsersRightsdata[i].isupdatable != 'Y') && (UsersRightsdata[i].isdeletable != 'Y') && (UsersRightsdata[i].isprintable != 'Y')) {
                                event.preventDefault();
                                $state.transitionTo("Masters", null, { notify: false });
                                $state.go('Masters');
                            }
                            else {
                                var request = {
                                    method: 'GET',
                                    url: WebApiUrl + "/api/SystemUser/GetUpdateSystemUserLog/?xFrmString=" + UsersRightsdata[i].SysProgName + "&xFrmProgramID=" + UsersRightsdata[i].SysProgID + "&xFrmOpenedByUserID=" + $localStorage.authorizationData.SysUserID + "",
                                    data: '',
                                    headers: {
                                        'Content-Type': undefined
                                    }
                                };
                                $http(request)
                                    .success(function (d) {
                                        alert("yes");
                                    })
                                    .error(function () {
                                    });
                            }
                        }
                    }
                }
            }
            else if (toState.name.indexOf("PreExam") == 0) {
                if (toState.name != 'PreExam' && toState.name != 'login') {
                    var UsersRightsdata = [];
                    UsersRightsdata = $localStorage.authorizationData.UserRights;
                    for (var i = 0; i < UsersRightsdata.length; i++) {
                        var PrName = 'PreExam.' + UsersRightsdata[i].GridFormToOpen;
                        if (PrName == toState.name) {
                            //if ((UsersRightsdata[i].isaddable != 'Y') && (UsersRightsdata[i].isupdatable != 'Y') && (UsersRightsdata[i].isdeletable != 'Y') && (UsersRightsdata[i].isprintable != 'Y')) {
                            //    event.preventDefault();
                            //    $state.transitionTo("PreExam", null, { notify: false });
                            //    $state.go('PreExam');
                            //}
                            //else {
                            var request = {
                                method: 'GET',
                                url: WebApiUrl + "/api/SystemUser/GetUpdateSystemUserLog/?xFrmString=" + UsersRightsdata[i].SysProgName + "&xFrmProgramID=" + UsersRightsdata[i].SysProgID + "&xFrmOpenedByUserID=" + $localStorage.authorizationData.SysUserID + "",
                                data: '',
                                headers: {
                                    'Content-Type': undefined
                                }
                            };
                            $http(request)
                                .success(function (d) {
                                    alert("yes");
                                })
                                .error(function () {
                                });
                            //}
                        }
                    }
                }
            }
            else if (toState.name.indexOf("StudentRequestBoard") == 0) {
                if (toState.name != 'StudentRequestBoard' && toState.name != 'login') {
                    var UsersRightsdata = [];
                    UsersRightsdata = $localStorage.authorizationData.UserRights;
                    for (var i = 0; i < UsersRightsdata.length; i++) {
                        var PrName = 'StudentRequestBoard.' + UsersRightsdata[i].GridFormToOpen;
                        if (PrName == toState.name) {
                            var request = {
                                method: 'GET',
                                url: WebApiUrl + "/api/SystemUser/GetUpdateSystemUserLog/?xFrmString=" + UsersRightsdata[i].SysProgName + "&xFrmProgramID=" + UsersRightsdata[i].SysProgID + "&xFrmOpenedByUserID=" + $localStorage.authorizationData.SysUserID + "",
                                data: '',
                                headers: {
                                    'Content-Type': undefined
                                }
                            };
                            $http(request)
                                .success(function (d) {
                                    alert("yes");
                                })
                                .error(function () {
                                });
                        }
                    }
                }
            }
            else if (toState.name.indexOf("Admission") == 0) {
                if (toState.name != 'Admission' && toState.name != 'login' && toState.name != 'AdmissionOther') {
                    var UsersRightsdata = [];
                    UsersRightsdata = $localStorage.authorizationData.UserRights;
                    for (var i = 0; i < UsersRightsdata.length; i++) {
                        var PrName;
                        if (UsersRightsdata[i].GridFormToOpen == "CollegeChangeRequestApprovalList") {
                            PrName = 'AdmissionOther.' + UsersRightsdata[i].GridFormToOpen;
                        }
                        else {
                            PrName = 'Admission.' + UsersRightsdata[i].GridFormToOpen;
                        }
                        if (PrName == toState.name) {
                            if ((UsersRightsdata[i].isaddable != 'Y') && (UsersRightsdata[i].isupdatable != 'Y') && (UsersRightsdata[i].isdeletable != 'Y') && (UsersRightsdata[i].isprintable != 'Y')) {
                                event.preventDefault();
                                if (UsersRightsdata[i].GridFormToOpen == "CollegeChangeRequestApprovalList") {
                                    $state.transitionTo("Admission", null, { notify: false });
                                    $state.go('Admission');
                                } else {
                                    $state.transitionTo("Admission", null, { notify: false });
                                    $state.go('Admission');
                                }
                            } else {
                                var request = {
                                    method: 'GET',
                                    url: WebApiUrl + "/api/SystemUser/GetUpdateSystemUserLog/?xFrmString=" + UsersRightsdata[i].SysProgName + "&xFrmProgramID=" + UsersRightsdata[i].SysProgID + "&xFrmOpenedByUserID=" + $localStorage.authorizationData.SysUserID + "",
                                    data: '',
                                    headers: {
                                        'Content-Type': undefined
                                    }
                                };
                                $http(request)
                                    .success(function (d) {
                                        alert("yes");
                                    })
                                    .error(function () {
                                    });
                            }
                        }
                        if (toState.name == 'Admission.PreYearAdmissionEntry') {
                            if ($localStorage.authorizationData.PrevAdmNo != 0) {
                                event.preventDefault();
                                $state.transitionTo("Admission", null, { notify: false });
                                $state.go('Admission');
                            } else {
                                var request = {
                                    method: 'GET',
                                    url: WebApiUrl + "/api/SystemUser/GetUpdateSystemUserLog/?xFrmString=" + UsersRightsdata[i].SysProgName + "&xFrmProgramID=" + UsersRightsdata[i].SysProgID + "&xFrmOpenedByUserID=" + $localStorage.authorizationData.SysUserID + "",
                                    data: '',
                                    headers: {
                                        'Content-Type': undefined
                                    }
                                };
                                $http(request)
                                    .success(function (d) {
                                        alert("yes");
                                    })
                                    .error(function () {
                                    });
                            }
                        }
                    }
                }
            }
            else if (toState.name.indexOf("Results") == 0) {
                if (toState.name != 'Results' && toState.name != 'login') {
                    var UsersRightsdata = [];
                    UsersRightsdata = $localStorage.authorizationData.UserRights;
                    for (var i = 0; i < UsersRightsdata.length; i++) {
                        var PrName;
                        PrName = 'Results.' + UsersRightsdata[i].GridFormToOpen;
                        if (PrName == toState.name) {
                            if ((UsersRightsdata[i].isaddable != 'Y') && (UsersRightsdata[i].isupdatable != 'Y') && (UsersRightsdata[i].isdeletable != 'Y') && (UsersRightsdata[i].isprintable != 'Y')) {
                                event.preventDefault();
                                $state.transitionTo("Results", null, { notify: false });
                                $state.go('Results');

                            } else {
                                var request = {
                                    method: 'GET',
                                    url: WebApiUrl + "/api/SystemUser/GetUpdateSystemUserLog/?xFrmString=" + UsersRightsdata[i].SysProgName + "&xFrmProgramID=" + UsersRightsdata[i].SysProgID + "&xFrmOpenedByUserID=" + $localStorage.authorizationData.SysUserID + "",
                                    data: '',
                                    headers: {
                                        'Content-Type': undefined
                                    }
                                };
                                $http(request)
                                    .success(function (d) {
                                        alert("yes");
                                    })
                                    .error(function () {
                                    });
                            }
                        }

                    }
                }
            } else if (toState.name.indexOf("Assessment") == 0) {
                if (toState.name != 'Assessment' && toState.name != 'login') {
                    var UsersRightsdata = [];
                    UsersRightsdata = $localStorage.authorizationData.UserRights;
                    for (var i = 0; i < UsersRightsdata.length; i++) {
                        var PrName;
                        PrName = 'Assessment.' + UsersRightsdata[i].GridFormToOpen;
                        if (PrName == toState.name) {
                            if ((UsersRightsdata[i].isaddable != 'Y') && (UsersRightsdata[i].isupdatable != 'Y') && (UsersRightsdata[i].isdeletable != 'Y') && (UsersRightsdata[i].isprintable != 'Y')) {
                                event.preventDefault();
                                $state.transitionTo("Assessment", null, { notify: false });
                                $state.go('Assessment');

                            } else {
                                var request = {
                                    method: 'GET',
                                    url: WebApiUrl + "/api/SystemUser/GetUpdateSystemUserLog/?xFrmString=" + UsersRightsdata[i].SysProgName + "&xFrmProgramID=" + UsersRightsdata[i].SysProgID + "&xFrmOpenedByUserID=" + $localStorage.authorizationData.SysUserID + "",
                                    data: '',
                                    headers: {
                                        'Content-Type': undefined
                                    }
                                };
                                $http(request)
                                    .success(function (d) {
                                        alert("yes");
                                    })
                                    .error(function () {
                                    });
                            }
                        }

                    }
                }
            }
        })
    });

    //var serviceBase = 'http://testapi.hebeon.com/';
    var serviceBase = 'http://sbptest.hebeon.com/API/';
    //var serviceBase = 'http://192.168.1.98:85/';

    app.constant('ngAuthSettings', {
        apiServiceBaseUri: serviceBase,
        clientId: 'baseApp',
        //WebApiUrl: 'http://localhost:65322/',
        //WebApiUrl: 'http://202.62.85.194/',
        ExportToExcelUrl: '',
        ExportToWordUrl: '',
        ExportToPdfUrl: '',
        LoggedUserId: 0,
        UserRights: [],
        CompanyId: 0,
        CompanyName: 'State Board of Technical Education and Training, Telangana',
        CollegeID: 0,
        AcdYrID: 0,
        PrevAdmNo: 0,
        StudentApprovalData: [],
        YrName: 2019,
        CollegeCatName: '',
        college_name1: '',
        MngtTypID: 0,
        SysUsrGrpID: 0,
        SeqNo: 0,
        DistrictIDs: ''
    });
    return app;
});

