define(['app'], function (app) {
    app.service("DataAccessService", function ($http, $q, AppSettings, $localStorage) {
        var WebApiUrl = AppSettings.WebApiUrl;
        this.getDataAll = function (url) {
            var deferred = $q.defer();
            url = WebApiUrl + url;
            $http({
                method: 'GET',
                url: url,
                headers: {
                    'Content-Type': "application/json",

                    'token': $localStorage.authToken
                },
                 timeout: 2 * 60 * 60 * 1000,
            }).then(function (data, status, headers, config, error) {
                deferred.resolve(data.data)
            }).catch(function (data, status, headers, config, error) {
                if (status == 408) {
                }
                else {
                    deferred.reject(data.data);
                }
            });
            return deferred.promise;
        };
        this.getDataWithPara = function (url, params) {
            var deferred = $q.defer();
            url = WebApiUrl + url;
            $http({
                method: 'GET',
                url: url,
                params: params,
                headers: {

                    'Content-Type': "application/json",
                    'token': $localStorage.authToken
                },
                 timeout: 2 * 60 * 60 * 1000,
            }).then(function (data, status, headers, config, error) {
                deferred.resolve(data.data);
            }).catch(function (data, status, headers, config, error) {
                if (status == 408) {
                }
                else {
                    deferred.reject(JSON.stringify(data.data));
                }
                //alert(JSON.stringify(error));
            });
            return deferred.promise;
        };
        this.postData = function (url, object) {
            var deferred = $q.defer();
            url = WebApiUrl + url;
            $http({
                method: 'POST',
                url: url,
                type: JSON,
                 timeout: 2 * 60 * 60 * 1000,
                headers: {
                    'Content-Type': "application/json",
                    'token': $localStorage.authToken
                },
                data: object
            }).
                then(function (data, status, headers, config, error) {
                    deferred.resolve(data.data);
                }).catch(function (data, status, headers, config, error) {
                    if (status == 408) {
                    }
                    else {
                        deferred.reject(JSON.stringify(data.data));
                    }
                });
            return deferred.promise;
        };

        this.postSignData = function (url, object) {
            var deferred = $q.defer();
            url = url;
            $http({
                method: 'POST',
                url: url,
                type: JSON,
                 timeout: 2 * 60 * 60 * 1000,
                headers: {
                    'Content-Type': "application/json",
                    'token': $localStorage.authToken
                },
                data: object
            }).
                then(function (data, status, headers, config, error) {
                    deferred.resolve(data.data);
                }).catch(function (data, status, headers, config, error) {
                    if (status == 408) {
                    }
                    else {
                        deferred.reject(JSON.stringify(data.data));
                    }
                });
            return deferred.promise;
        };
        this.putData = function (url, object) {
            var deferred = $q.defer();
            url = WebApiUrl + url;
            $http({
                method: 'PUT',
                url: url,
                type: JSON,
                data: object
            }).then(function (data, status, headers, config, error) {
                deferred.resolve(data.data);
            }).catch(function (data, status, headers, config, error) {
                if (status == 408) {
                }
                else {
                    deferred.reject(JSON.stringify(data.data));
                }
            });
            return deferred.promise;
        };
        this.deleteData = function (url, params) {
            var deferred = $q.defer();
            url = WebApiUrl + url;
            $http({
                method: 'DELETE',
                url: url,
                type: JSON,
                params: params
            }).then(function (data, status, headers, config, error) {
                deferred.resolve(data.data);
            }).catch(function (data, status, headers, config, error) {
                if (status == 408) {
                }
                else {
                    deferred.reject(JSON.stringify(data.data));
                }
            });
            return deferred.promise;
        };

        this.uploadFileToUrl = function (url, file) {
            var deferred = $q.defer();
            var model = {};
            url = WebApiUrl + url;
            var fd = new FormData();
            fd.append('file', file);
            $http({
                method: 'POST',
                url: url,
                data: fd,
                enctype: "multipart/form-data",
                 timeout: 2 * 60 * 60 * 1000,
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined,
                    'token': $localStorage.authToken
                },
            }).
                then(function (data, status, headers, config, error) {
                    deferred.resolve(data.data);
                }).catch(function (data, status, headers, config, error) {
                    if (status == 408) {
                    }
                    else {
                        deferred.reject(JSON.stringify(data.data));
                    }
                });
            return deferred.promise;
        };



        this.getMDBFile = function (url) {
            var deferred = $q.defer();
            url = WebApiUrl + url;
            $http({
                method: 'GET',
                url: url,
                headers: {
                    'Accept': 'application/mdb;q=0.9,*/*;q=0.8',
                    'Upgrade-Insecure-Requests': '1',
                    'Content-Disposition': 'attachment',
                    'filename': 'ATP.mdb'
                },
                responseType: 'blob'
            }).then(function (data, status, headers, config, error) {
                deferred.resolve(data.data)
            }).catch(function (data, status, headers, config, error) {
                if (status == 408) {
                }
                else {
                    deferred.reject(data.data);
                }
            });
            return deferred.promise;
        };
        this.PutUploadImage = function (url, Image, StudRegID, SSCHallTicket, UpdLoginID, PhotoUp) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: WebApiUrl + url,
                headers: { 'Content-Type': undefined },
                transformRequest: function (data) {
                    var formData = new FormData();
                    formData.append("StudRegID", angular.toJson(data.StudRegID));
                    formData.append("SSCHallTicket", angular.toJson(data.SSCHallTicket));
                    formData.append("UpdLoginID", angular.toJson(data.UpdLoginID));
                    formData.append("PhotoUp", angular.toJson(data.PhotoUp));
                    for (var i = 0; i < data.Image.length; i++) {
                        formData.append("Image" + i, data.Image[i]);
                    }
                    return formData;
                },
                data: { StudRegID: StudRegID, Image: Image, SSCHallTicket: SSCHallTicket, UpdLoginID: UpdLoginID, PhotoUp: PhotoUp }
            }).then(function (data, status, headers, config) {
                deferred.resolve(data);
            }).catch(function (data, status, headers, config, error) {
                deferred.resolve(data);
            });
            return deferred.promise;
        };

        this.postRdKyc = function (object) {
            var deferred = $q.defer();
            url = "https://localhost:11100/rd/capture";
            $http({
                method: 'CAPTURE',
                url: url,
                type: "text/xml",
                headers: {
                    'Content-Type': "text/plain",
                    'Accept': 'text/xml'
                },
                data: object
            }).
                then(function (data, status, headers, config, error) {
                    deferred.resolve(data.data);
                }).catch(function (data, status, headers, config, error) {
                    if (status === 408) {
                        // 
                    }
                    else {
                        deferred.reject((data.data));
                    }
                });
            return deferred.promise;
        };
        this.postRdKyc2 = function (object) {
            var deferred = $q.defer();
            url = "https://127.0.0.1:11101/rd/capture";
            $http({
                method: 'CAPTURE',
                url: url,
                type: "text/xml",
                headers: {
                    'Content-Type': "text/plain",
                    'Accept': 'text/xml'
                },
                data: object
            }).
                then(function (data, status, headers, config, error) {
                    deferred.resolve(data.data);
                }).catch(function (data, status, headers, config, error) {
                    if (status === 408) {
                        // 
                    }
                    else {
                        deferred.reject((data.data));
                    }
                });
            return deferred.promise;
        };
        this.postRdFpKyc = function (uri, object) {
            var deferred = $q.defer();
            url = uri + "/rd/capture";
            $http({
                method: 'CAPTURE',
                url: url,
                type: "text/xml",
                headers: {
                    'Content-Type': "text/plain",
                    'Accept': 'text/xml'
                },
                data: object
            }).
                then(function (data, status, headers, config, error) {
                    deferred.resolve(data.data);
                }).catch(function (data, status, headers, config, error) {
                    if (status === 408) {
                        // 
                    }
                    else {
                        deferred.reject((data.data));
                    }
                });
            return deferred.promise;
        };
        this.postRdIrisKyc = function (uri, object) {
            var deferred = $q.defer();
            url = uri + "/BISPL/capture";
            $http({
                method: 'CAPTURE',
                url: url,
                type: "text/xml",
                headers: {
                    'Content-Type': "text/plain",
                    'Accept': 'text/xml'
                },
                data: object
            }).
                then(function (data, status, headers, config, error) {
                    deferred.resolve(data.data);
                }).catch(function (data, status, headers, config, error) {
                    if (status === 408) {
                        // 
                    }
                    else {
                        deferred.reject((data.data));
                    }
                });
            return deferred.promise;
        };

        this.getDataWithParaCustomUrl = function (url, params) {
            var deferred = $q.defer();
            url = url;
            $http({
                method: 'GET',
                url: url,
                params: params,
                headers: {
                    'Content-Type': "application/json",
                    'token': $localStorage.authToken
                },

                 timeout: 2 * 60 * 60 * 1000,
            }).then(function (data, status, headers, config, error) {
                deferred.resolve(data.data);
            }).catch(function (data, status, headers, config, error) {
                if (status == 408) {
                }
                else {
                    deferred.reject(JSON.stringify(data.data));
                }
                //alert(JSON.stringify(error));
            });
            return deferred.promise;
        };
        this.postDataCustomUrl = function (url, object) {
            var deferred = $q.defer();
            url = url;
            $http({
                method: 'POST',
                url: url,
                type: JSON,
                 timeout: 2 * 60 * 60 * 1000,
                headers: {
                    'Content-Type': "application/json",
                    'token': $localStorage.authToken
                },
                data: object
            }).
                then(function (data, status, headers, config, error) {
                    deferred.resolve(data.data);
                }).catch(function (data, status, headers, config, error) {
                    if (status == 408) {
                    }
                    else {
                        deferred.reject(JSON.stringify(data.data));
                    }
                });
            return deferred.promise;
        };


        //this.sendTwalletPaymentRequest = function (url, object) {
        //    var deferred = $q.defer();
        //    url = url;

        //    var form = $('<form></form>');
        //    form.attr("method", "post");
        //    form.attr("action", url);

        //    var field = $('<input></input>');
        //    field.attr("type", "hidden");
        //    field.attr("name", "Data");
        //    field.attr("value", object.Data);

        //    form.append(field);

        //    var field1 = $('<input></input>');
        //    field1.attr("type", "hidden");
        //    field1.attr("name", "Skey");
        //    field1.attr("value", object.Skey);

        //    form.append(field1);
        //    $(document.body).append(form);
        //    form.submit();
        //}
        //    $http({
        //        method: 'POST',
        //        url: url,
        //        type: JSON,
        //        timeout: 2 * 60 * 60 * 1000,
        //        headers: {
        //            'Content-Type': "application/json",
        //            'token': $localStorage.authToken
        //        },
        //        data: JSON.stringify(object),
        //    }).then(function (data, status, headers, config, error) {
        //            deferred.resolve(data.data);
        //        }).catch(function (data, status, headers, config, error) {
        //            if (status == 408) {
        //            }
        //            else {
        //                deferred.reject(JSON.stringify(data.data));
        //            }
        //        });
        //    return deferred.promise;
        //};
    });
});