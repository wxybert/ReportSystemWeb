/**
 * Created by tlh on 2016/5/13.
 */
var preUrl = '';
var selectedReportId;
var selectedListType = 'LIST_ALL';
var selectedTerm;
var selectedStatus;
var pageData;
var table;
var returnReportUrl;
var userId;
var requestUrl = preUrl + "report/student/listAll.do";
var listAllUrl = preUrl + "report/student/listAll.do";
var listByTermUrl = preUrl + "report/student/listByTerm.do";
var listByStatusUrl = preUrl + "report/student/listByStatus.do";
var pageSize = 5;
$(document).ready(function () {
    userId = $.getUrlParam('userId');
    initNavigationBar();
    table = $('#table');
    initTable();
    $("#selected_file_name")[0].style.display = "none";
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',      // 上传模式,依次退化
        browse_button: 'pickfiles',         // 上传选择的点选按钮，**必需**
        // 在初始化时，uptoken, uptoken_url, uptoken_func 三个参数中必须有一个被设置
        uptoken_url: preUrl + 'upload/getUpToken.do',         // Ajax 请求 uptoken 的 Url，**强烈建议设置**（服务端提供）
        get_new_uptoken: false,             // 设置上传文件的时候是否每次都重新获取新的 uptoken
        max_file_size: '100mb',
        domain: 'o762c73os.bkt.clouddn.com',     // bucket 域名，下载资源时用到，**必需**
        chunk_size: '4mb',                  // 分块上传时，每块的体积
        auto_start: false,                   // 选择文件后自动上传，若关闭需要自己绑定事件触发上传,
        init: {
            'FilesAdded': function (up, files) {
                var file = up.files[up.files.length - 1];
                var selectedFile = $("#selected_file_name")[0];
                selectedFile.style.display = "inline";
                selectedFile.innerText = file.name;
            },
            'UploadProgress': function (up, file) {
                // 每个文件上传时,处理相关的事情
                if (file.percent != 100)
                    NProgress.set(file.percent * 0.01);
            },
            'FileUploaded': function (up, file, info) {
                var domain = up.getOption('domain');
                var res = eval('(' + info + ')');
                returnReportUrl = 'http://' + domain + '/' + res.key; //获取上传成功后的文件的Url
                updateReportUrl();
            },
            'Error': function (up, err, errTip) {
                //上传出错时,处理相关的事情
                notice('上传失败，' + errTip, 'error');
            }
        }
    });
    uploader.bind('FilesAdded', function (uploader, file) {
        //确保每次选择文件只能添加一个文件，删掉前面添加的文件
        if (uploader.files.length > 1) {
            uploader.splice(0, 1);
        }
        var file = uploader.files[0];
        file.name = userId + selectedReportId + file.name;
    });
    $("#summit_report").click(function () {
        if (NProgress.isStarted()) {
            notice("我们在为您拼命加载中，请您耐心等待！Loading...", 'success');
            return;
        }
        if (!validateForm($("#form_upload_report")[0])) {
            return;
        }
        if (!returnReportUrl)
            uploader.start();
        else {
            NProgress.start();
            updateReportUrl();
        }
    });
    $("#summit_advice").click(function () {
        if (NProgress.isStarted()) {
            notice("我们在为您拼命加载中，请您耐心等待！Loading...", 'success');
            return;
        }
        if (!validateForm($("#form_send_advice")[0])) {
            return;
        }
        $.ajax({
            type: "POST",
            url: preUrl + "report/student/update.do",
            dataType: 'json',
            data: {
                userId: userId,
                password: $("#password").val(),
                reportId: selectedReportId,
                advice: $("#advice").val()
            },
            success: function (data) {
                NProgress.done();
                if (data.result == "failed") {
                    notice(data.msg, 'error');
                } else if (data.result == "success") {
                    notice(data.msg, 'success');
                }
                $('#updateAdviceModal').modal('toggle');
            },
            error: function (jqXHR) {
                NProgress.done();
                notice("似乎出现了些小问题,无法提交修改", 'error');
            }
        });
    });
    $(".navbar-brand").attr("href", preUrl);
});
function updateReportUrl() {
    $.ajax({
        type: "POST",
        url: preUrl + "report/student/update.do",
        dataType: 'json',
        data: {
            userId: userId,
            password: $("#password_for_updateReport").val(),
            reportId: selectedReportId,
            docUrl: returnReportUrl
        },
        success: function (data) {
            NProgress.done();
            if (data.result == "failed") {
                notice(data.msg, 'error');
            } else if (data.result == "success") {
                $('#uploadReportModal').modal('toggle');
                notice(data.msg, 'success');
            }
        },
        error: function (jqXHR) {
            notice("似乎出现了些小问题,错误码：" + jqXHR.status, 'error');
            NProgress.done();
        }
    });
}
function initTable() {
    table.bootstrapTable({
        columns: [{
            title: '实验报告题目',
            field: 'name',
            align: 'center',
            width: "10%",
            valign: 'middle'
        }, {
            title: '实验报告内容',
            field: 'content',
            align: 'center',
            width: "30%",
            valign: 'middle'
        }, {
            title: '注意事项',
            field: 'note',
            align: 'center',
            width: "20%",
            valign: 'middle'
        }, {
            title: '指导老师',
            field: 'teacher.name',
            align: 'center',
            valign: 'middle'
        }, {
            title: '课程',
            field: 'lesson.name',
            align: 'center',
            valign: 'middle'
        }, {
            title: '布置时间',
            field: 'date_from',
            align: 'center',
            valign: 'middle',
            sortable: true
        }, {
            title: '截止时间',
            field: 'date_to',
            align: 'center',
            valign: 'middle',
            sortable: true
        }, {
            title: '模板',
            field: 'templateUrl',
            align: 'center',
            valign: 'middle',
            width: "1%",
            formatter: templateUrlFormatter
        }, {
            title: '操作',
            align: 'center',
            valign: 'middle',
            events: operateEvents,
            formatter: operateFormatter
        }],
        pageList: "[10,20,50,100]",
        toolbar: "#toolbar",
        search: "true",
        showRefresh: "true",
        showToggle: "true",
        showColumns: "true",
        showExport: "true",
        detailView: "true",
        detailFormatter: "detailFormatter",

        dataType: "json",
        url: requestUrl,
        pagination: true,
        sidePagination: "server",
        pageSize: pageSize,
        queryParams: getParams,
        responseHandler: responseHandler
    });
}
function initNavigationBar() {
    addTermListItem();
    $("#btn_logout").click(function () {
        if (NProgress.isStarted()) {
            notice("我们在为您拼命加载中，请您耐心等待！Loading...", 'info');
            return;
        }
        NProgress.start();
        $.ajax({
            type: "POST",
            url: preUrl + "account/logout.do",
            dataType: 'json',
            success: function (data) {
                NProgress.done();
                if (data.result == "failed") {
                    notice(data.msg, 'error');
                }
                window.open("login.html", "_self");
            },
            error: function (jqXHR) {
                NProgress.done();
                window.open("login.html", "_self");
                notice("似乎出现了些小问题,无法注销", 'error');
            }
        })
    });
    $("#listAll").click(function () {
        switchTab($(this));
        NProgress.start();
        selectedListType = 'LIST_ALL';
        requestUrl = listAllUrl;
        table.bootstrapTable('refresh', {url: requestUrl});
    });

    $.ajax({
        type: "POST",
        url: preUrl + "account/getInfo.do",
        dataType: 'json',
        data: {
            userId: userId,
            identity: $.getUrlParam('identity')
        },
        success: function (data) {
            if (data.result == "success") {
                var userName = data.user.name;
                $("#welcome")[0].innerText = 'hi!  ' + userName + '同学';
            }
        }
    });


}
function switchTab(tab) {
    var navigation = $("#navigation")[0];
    $("li").removeClass('active');
    tab.addClass('active');
}
function addTermListItem() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();
    var termSelector = $("#term_selector")[0];
    var child1 = document.createElement("li");
    if (month > 1 && month < 8) {
        child1.setAttribute('value', year - 1 + '-2');
        var a1 = document.createElement('a');
        a1.appendChild(document.createTextNode((year - 1) + '年第二学期'));
        a1.href = '#';
        child1.appendChild(a1);
        child1.onclick = onclickTermListItem;
        termSelector.appendChild(child1);
        var child2 = document.createElement("li");
        child2.setAttribute('value', year - 1 + '-1');
        var a2 = document.createElement('a');
        a2.href = '#';
        a2.appendChild(document.createTextNode((year - 1) + '年第一学期'));
        child2.appendChild(a2);
        termSelector.appendChild(child2);
        child2.onclick = onclickTermListItem;
        var child3 = document.createElement("li");
        child3.setAttribute('value', year - 2 + '-2');
        var a3 = document.createElement('a');
        a3.href = '#';
        a3.appendChild(document.createTextNode(year - 2 + '年第二学期'));
        child3.appendChild(a3);
        termSelector.appendChild(child3);
        child3.onclick = onclickTermListItem;
        var child4 = document.createElement("li");
        child4.setAttribute('value', year - 2 + '-1');
        var a4 = document.createElement('a');
        a4.href = '#';
        a4.appendChild(document.createTextNode(year - 2 + '年第一学期'));
        child4.appendChild(a4);
        child4.onclick = onclickTermListItem;
        termSelector.appendChild(child4);
    } else {
        child1.setAttribute('value', year + '-1');
        var a1 = document.createElement('a');
        a1.href = '#';
        a1.appendChild(document.createTextNode((year) + '年第一学期'));
        child1.appendChild(a1);
        termSelector.appendChild(child1);
        child1.onclick = onclickTermListItem;
        var child2 = document.createElement("li");
        child2.setAttribute('value', year - 1 + '-2');
        var a2 = document.createElement('a');
        a2.href = '#';
        a2.appendChild(document.createTextNode(year - 1 + '年第二学期'));
        child2.appendChild(a2);
        termSelector.appendChild(child2);
        child2.onclick = onclickTermListItem;
        var child3 = document.createElement("li");
        child3.setAttribute('value', year - 1 + '-1');
        var a3 = document.createElement('a');
        a3.href = '#';
        a3.appendChild(document.createTextNode(year - 1 + '年第一学期'));
        child3.appendChild(a3);
        child3.onclick = onclickTermListItem;
        termSelector.appendChild(child3);
    }
}
function onclickTermListItem() {
    switchTab($("#listByTerm"));
    selectedListType = 'LIST_BY_TERM';
    requestUrl = listByTermUrl;
    selectedTerm = $(this).attr('value');
    NProgress.start();
    table.bootstrapTable('refresh', {url: requestUrl});
}
function onclickStatusListItem(li) {
    switchTab($("#listByStatus"));
    selectedListType = 'LIST_BY_STATUS';
    requestUrl = listByStatusUrl;
    selectedStatus = $(li).attr('value');
    NProgress.start();
    table.bootstrapTable('refresh', {url: requestUrl});
}
function getParams(config) {
    var params = {
        userId: userId,
        itemNum: config.limit,
        page: table.bootstrapTable('getOptions').pageNumber
    };
    switch (selectedListType) {
        case 'LIST_ALL':
            break;
        case 'LIST_BY_TERM':
            params.term = selectedTerm;
            break;
        case 'LIST_BY_STATUS':
            params.status = selectedStatus;
            break;
        default:
            break;
    }
    return params;
}

function responseHandler(sourceData) {
    NProgress.done();
    if (sourceData.result == "success") {
        pageData = sourceData.data;
        for (var i = 0; i < pageData.length; i++) {
            if (pageData[i].location == 0) {
                pageData[i].location = "余区";
            } else {
                pageData[i].location = "马区";
            }
            switch (pageData[i].status) {
                case 0:
                    pageData[i].status = "未提交";
                    break;
                case 1:
                    pageData[i].status = "已提交";
                    break;
                case 2:
                    pageData[i].status = "已批改";
                    break;
            }
            if (pageData[i].date_from)
                pageData[i].date_from = pageData[i].date_from.split(" ")[0];
        }
        return {
            "total": sourceData.total,
            "rows": pageData
        }
    } else {
        return {
            "total": 0,
            "rows": []
        }
    }
}

function detailFormatter(index, row) {
    NProgress.start();
    var html = [];
    html.push('<ul>');
    $.ajax({
        type: "POST",
        url: preUrl + "report/student/detail.do",
        dataType: 'json',
        async: false,
        data: {
            userId: userId,
            reportId: row.reportId
        },
        success: function (data) {
            NProgress.done();
            if (data.result == "success") {
                var row = data.data[0];
                $.each(row, function (key, value) {
                    switch (key) {
                        case 'score':
                            html.push('<li><b>' + '分数' + ':</b> ' + value + '</li>');
                            break;
                        case 'comment':
                            html.push('<li><b>' + '老师评语' + ':</b> ' + value + '</li>');
                            break;
                        case 'advice':
                            html.push('<li><b>' + '你的反馈或建议' + ':</b> ' + value + '</li>');
                            break;
                        case 'name':
                            html.push('<li><b>' + '实验报告题目' + ':</b> ' + value + '</li>');
                            break;
                        case 'content':
                            html.push('<li><b>' + '实验报告内容' + ':</b> ' + value + '</li>');
                            break;
                        case 'note':
                            html.push('<li><b>' + '注意事项' + ':</b> ' + value + '</li>');
                            break;
                        case 'status':
                        {
                            switch (value) {
                                case 0:
                                    value = "未提交";
                                    break;
                                case 1:
                                    value = "已提交";
                                    break;
                                case 2:
                                    value = "已批改";
                                    break;
                                default:
                                    value = "未提交";
                                    break;
                            }
                            html.push('<li><b>' + '状态' + ':</b> ' + value + '</li>');
                            break;
                        }
                        case 'major':
                            html.push('<li><b>' + '专业' + ':</b> ' + value + '</li>');
                            break;
                        case 'date_from':
                            html.push('<li><b>' + '布置时间：' + ':</b> ' + value + '</li>');
                            break;
                        case 'date_to':
                            html.push('<li><b>' + '截止提交时间：' + ':</b> ' + value + '</li>');
                            break;
                        case 'college':
                            html.push('<li><b>' + '学院：' + ':</b> ' + value + '</li>');
                            break;
                        case 'lesson':
                            html.push('<li><b>' + '课程' + ':</b> ' + value.name + '</li>');
                            html.push('&nbsp;&nbsp;' + '年级' + ': ' + value.grade + '<br>');
                            html.push('&nbsp;&nbsp;' + '学期' + ':' + value.term + '<br>');
                            break;
                        case 'teacher':
                            html.push('<li><b>' + '指导老师' + ':</b> ' + value.name + '</li>');
                            html.push('&nbsp;&nbsp;' + '学院' + ': ' + value.college + '<br>');
                            var loc;
                            if (value.location == 0)
                                loc = "余区";
                            else loc = "马区";
                            html.push('&nbsp;&nbsp;' + '校区' + ': ' + loc + '<br>');
                            break;
                        default:
                            break;
                    }
                });
                html.push('</ul>');
            }
        },
        error: function (jqXHR) {
            NProgress.done();
            notice("似乎出现了些小问题,错误码：" + jqXHR.status, 'error');
        }
    });
    return html.join('');
}

function templateUrlFormatter(value, row, index) {
    if (row.templateUrl) {
        return [
            '<a target="_blank" title="下载" href="' + row.templateUrl + '">',
            '<span class="fui-link"></span>',
            '</a>'
        ].join('');
    } else {
        return [
            '<a target="_blank" title="暂无资源，请联系指导老师" disabled>',
            '<span class="fui-link"></span>',
            '</a>'
        ].join('');
    }

}

function operateFormatter(value, row, index) {
    return [
        '<a class="download" href="javascript:void(0)" title="下载">',
        '<i class="glyphicon glyphicon-download-alt"></i>',
        '</a>&nbsp;',
        '<a class="upload" href="javascript:void(0)" title="上传提交" data-toggle="modal" data-target="#uploadReportModal">',
        '<i class="glyphicon glyphicon-open"></i>',
        '</a>&nbsp;',
        '<a class="sendAdvice" href="javascript:void(0)" title="给老师留言" data-toggle="modal" data-target="#updateAdviceModal">',
        '<i class="glyphicon glyphicon-envelope"></i>',
        '</a>'
    ].join('');
}
window.operateEvents = {
    'click .download': function (e, value, row, index) {
        NProgress.start();
        $.ajax({
            type: "POST",
            url: preUrl + "report/student/detail.do",
            dataType: 'json',
            async: false,
            data: {
                userId: userId,
                reportId: row.reportId
            },
            success: function (data) {
                NProgress.done();
                if (data.result == "success") {
                    if (data.data[0].docUrl) {
                        window.open(data.data[0].docUrl, "_blank");
                    } else {
                        notice("你的实验报告还没提交呢！", 'error');
                    }
                }
            },
            error: function (jqXHR) {
                NProgress.done();
                notice("似乎出现了些小问题,错误码：" + jqXHR.status, 'error');
            }
        });
    },
    'click .upload': function (e, value, row, index) {
        selectedReportId = row.reportId;
    },
    'click .sendAdvice': function (e, value, row, index) {
        selectedReportId = row.reportId;
    }
};
