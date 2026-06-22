define(['app'], function (app) {
    app.controller("StudentAttendanceController", function ($scope, $http, $localStorage, $state, $window, $stateParams, AppSettings, $uibModal, PreExaminationService) {
        // $scope.buttontext = "Show Full Attendance";

        $scope.ResultFound = false;
        $scope.ResultNotFound = false;
        $scope.LoadImg = false;


        /// recaptcha

        $scope.createCaptcha = function () {
            $scope.newCapchaCode = "";
            document.getElementById('captcha').innerHTML = "";
            var charsArray =
                "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@!#$%^&*";
            var lengthOtp = 6;
            var captcha = [];
            for (var i = 0; i < lengthOtp; i++) {
                //below code will not allow Repetition of Characters
                var index = Math.floor(Math.random() * charsArray.length + 1); //get the next character from the array
                if (captcha.indexOf(charsArray[index]) == -1)
                    captcha.push(charsArray[index]);
                else i--;
            }
            var canv = document.createElement("canvas");
            canv.id = "captcha";
            canv.width = 150;
            canv.height = 50;
            var ctx = canv.getContext("2d");
            ctx.font = "25px Georgia";
            ctx.strokeText(captcha.join(""), 0, 30);

            //     var attr = document.createElement("a");
            //     attr.id = "attr";
            //    attr.title ="Please click here to reload captcha";

            //    var iattr = document.createElement("i");
            //    iattr.id = "iattr";
            //   iattr.className ="fa fa-refresh"; 
            //   var att = document.createAttribute("aria-hidden");       // Create a "class" attribute
            //     att.value = "true"; 
            //     iattr.setAttributeNode(att);
            //   document.getElementById("attr").appendChild(iattr);

            $scope.newCapchaCode = captcha.join("");
            document.getElementById("captcha").appendChild(canv); // adds the canvas to the body element
            // document.getElementById("captcha").appendChild(attr); // adds the canvas to the body element
        }




        $window.validateRecaptcha = $scope.validateRecaptcha;


        $scope.keyLogin = function ($event) {
            if ($event.keyCode == 13) {
                $scope.getStudentDetails();
            }
        }




        $scope.getStudentDetails = function () {

            if ($scope.Studentpin == "" || $scope.Studentpin == undefined || $scope.Studentpin == null) {
                alert("Enter Pin");
                return;
            }
            if ($scope.attCaptcha == undefined || $scope.attCaptcha == "") {
                alert("Enter Captcha");
                return;
            };


            if ($scope.attCaptcha == $scope.newCapchaCode) {
                // alert("Valid Captcha");
            } else {
                alert("Invalid Captcha. try Again");
                $scope.attCaptcha = "";
                $scope.createCaptcha();
                return;
            }

            $scope.attendancedata = [];
            $scope.months = [];
            $scope.StudentData = [];
            $scope.filteredData = [];
            AttDataList = [];
            window.localStorage.setItem("pin", pin);
            var pin = pin;
            var days = [];
            var istr = "";
            for (var i = 1; i <= 31; i++) {
                if (i < 10)
                    istr = "0" + i;
                else
                    istr = "" + i;
                days.push(istr);
            }
            //  $scope.attName = name;
            $scope.days = days
            $scope.LoadImg = true;
            $scope.showbrancwiseattdata = false;
            var getAttendance = PreExaminationService.getAttendanceReport($scope.Studentpin);
            getAttendance.then(function (res) {
                $scope.attCaptcha = "";
                $scope.createCaptcha();
                try {
                    var response = JSON.parse(res);
                } catch (err) {
                    var arr = {Table :[]}
                    var response = arr;
                    $scope.result = false;
                    alert("error while loading Data");
                }
                if (response.Table.length > 0) {
                    $scope.result = true;
                    $scope.ResultFound = true;
                    $scope.ResultNotFound = false;
                    $scope.LoadImg = false;
                    $scope.StudentData = response.Table[0];
                    if ($scope.StudentData.semid == 8 || $scope.StudentData.semid == 9) {
                        $scope.StudentData.WorkingDaysForExams = 180;
                    }
                    //else if ($scope.StudentData.semid == 1) {
                    //    $scope.StudentData.WorkingDaysForExams = 85;
                    //}
                    else {
                        $scope.StudentData.WorkingDaysForExams = 90;
                    }
                    $scope.StudentData.AttdForExams = (($scope.StudentData.NumberOfDaysPresent / $scope.StudentData.ExamsWorkingDays) * 100).toFixed(0);

                    if (response.Table1.length > 0 && response.Table2.length > 0) {
                        $scope.attmonths = [];
                        $scope.filteredData = [];
                        $scope.filteredData = response.Table2;
                        $scope.data = $scope.filteredData;
                        $scope.totalattreport = response.Table1;
                        $scope.attendId = response.Table[0].AttendeeId;
                        $scope.attpin = response.Table[0].Pin;
                        $scope.attName = response.Table[0].Name;
                        var attbymonth = [];

                        var arr = $scope.totalattreport;
                        var finalarr = [];
                        for (var j = 0; j < response.Table2.length; j++) {
                            var attbymonth = [];
                            var temparr2 = [];
                            for (var i = 0; i < arr.length; i++) {
                                if (arr[i].AttendanceMonth === response.Table2[j].AttendanceMonth) {
                                    attbymonth.push(arr[i]);
                                    temparr2.push(arr[i].Day);
                                }
                            }

                            var attstatarr = [];
                            finalarr[j] = {};
                            finalarr[j].month = response.Table2[j].AttendanceMonth;
                            attstatarr[j] = {};
                            attbymonth.forEach(function (value) {
                                var temparr1 = [];
                                $scope.days.forEach(function (day, k) {
                                    if (value.Day == day && temparr2.includes(day)) {
                                        let att = {};
                                        att.day = value.Day;
                                        att.AttendeeId = value.AttendeeId;
                                        att.date = value.Date;
                                        att.month = value.AttendanceMonth;
                                        att.Status = value.Status;
                                        attstatarr[k] = att;
                                        temparr1.push(value.Day);
                                    } else if (value.Day != day && !temparr1.includes(day) && !temparr2.includes(day)) {
                                        let att = {};
                                        let D = value.Date.split('-');
                                        var dat = D[0] + '-' + D[1] + '-' + day;
                                        att.day = day;
                                        att.date = dat;
                                        att.AttendeeId = value.AttendeeId;
                                        att.month = value.AttendanceMonth;
                                        att.Status = "-";
                                        attstatarr[k] = att;
                                        temparr1.push(day);
                                    }

                                });
                                finalarr[j].attstat = attstatarr;
                            });
                            $scope.attendancedata = finalarr;



                        }
                        $scope.months = [];
                        $scope.filteredData = [];
                        AttDataList = [];
                        window.localStorage.setItem("pin", pin);
                        var pin = pin;
                        var days = [];
                        var istr = "";
                        for (var i = 1; i <= 31; i++) {
                            if (i < 10)
                                istr = "0" + i;
                            else
                                istr = "" + i;
                            days.push(istr);
                        }
                        // $scope.attName = name;
                        $scope.days = days
                        // $scope.LoadImg = true;
                        $scope.showbrancwiseattdata = false;
                    }
                } else {
                    $scope.result = false;
                    $scope.ResultFound = false;
                    $scope.ResultNotFound = true;
                    $scope.LoadImg = false;
                }
            },
                function (error) {
                    $scope.result = false;
                    $scope.ResultFound = false;
                    $scope.ResultNotFound = true;
                    $scope.LoadImg = false;
                    alert("error while loading Data");
                    console.log(error);
                });
        }

        $scope.closeModal = function () {
            $scope.modalInstance.close();
        };


        $scope.OpenAttendance = function () {
            $scope.showfullattendance = true;
            $scope.buttontext = "Hide";
            //$scope.modalInstance = $uibModal.open({
            //    templateUrl: "/app/views/Admission/Reports/StudentAttendanceReport.html",
            //    size: 'xlg',
            //    scope: $scope,
            //    windowClass: 'modal-fit-att',
            //    //backdrop: 'static',

            //});
        }
        $scope.printDetails = function (areatoprint) {

            // var divName = "idtoDivPrintAdmin";
            var divToPrint = document.getElementById(areatoprint);
            var temp = document.body.innerHTML;
            $("#studentAttendance1").hide();
            var domClone = divToPrint.cloneNode(true);
            var $printSection = document.getElementById("printSection");
            //document.body.innerHTML = "";
            if (!$printSection) {
                var $printSection = document.createElement("div");
                $printSection.id = "printSection";
                document.body.appendChild($printSection);
            }
            $printSection.innerHTML = "";
            $printSection.appendChild(domClone);
            // alert($printSection.innerHTML);
            document.title = "Attendance Sheet" + $scope.Studentpin;
            window.print();
            document.body.removeChild($printSection);
            $("#studentAttendance1").show();

        }
    })
})