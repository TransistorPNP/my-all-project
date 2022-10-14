"use strict";
$(document).ready(function () {
    /* KHU VỰC BIẾN TOÀN CỤC */

    var gOrderIdOnClick = {
        id: "",
        orderId: ""
    };

    const gPIZZA_URL = "http://42.115.221.44:8080/devcamp-pizza365";

    const gDATA_HEAD = ["orderId", "kichCo", "loaiPizza", "idLoaiNuocUong", "thanhTien", "hoTen", "soDienThoai", "trangThai", "chiTiet"];
    const gCOL_ORDER_ID = 0;
    const gCOL_COMBO = 1;
    const gCOL_TYPE = 2;
    const gCOL_DRINK = 3;
    const gCOL_PRICE = 4;
    const gCOL_TEN = 5;
    const gCOL_SDT = 6;
    const gCOL_STAT = 7;
    const gCOL_DETAIL = 8;

    const gOrderTable = $("#orders-table").DataTable({
        columns: [
            { data: gDATA_HEAD[gCOL_ORDER_ID] },
            { data: gDATA_HEAD[gCOL_COMBO] },
            { data: gDATA_HEAD[gCOL_TYPE] },
            { data: gDATA_HEAD[gCOL_DRINK] },
            { data: gDATA_HEAD[gCOL_PRICE] },
            { data: gDATA_HEAD[gCOL_TEN] },
            { data: gDATA_HEAD[gCOL_SDT] },
            { data: gDATA_HEAD[gCOL_STAT] },
            { data: gDATA_HEAD[gCOL_DETAIL] }
        ],
        columnDefs: [
            {
                targets: gCOL_DETAIL,
                defaultContent: "<button class='btn btn-info btn-details'>Chi tiết</button>"
            }
        ]
    });



    /*KHU VỰC XỬ LÝ CÁC SỰ KIỆN */

    //gọi API trả dữ liệu, tải dữ liệu vào bảng
    getAllOrder();
    loadDrinks();

    //hảm gọi API lấy danh sách order
    function getAllOrder() {
        $.ajax({
            type: "GET",
            url: gPIZZA_URL + "/orders",
            dataType: "json",
            success: function (response) {
                loadOrderToTable(response);
            },
            error: function (err) {
                console.log(err.responseText);
            }
        });
    }

    //gọi api và load danh sách đồ uống
    function loadDrinks() {
        $.ajax({
            type: "GET",
            url: gPIZZA_URL + "/drinks",
            dataType: "json",
            success: function (response) {
                let vSelDrink = $("#modalDetail-drink");
                $(response).each((_index, elem) => {
                    $("<option>").val(elem.maNuocUong)
                        .html(elem.tenNuocUong)
                        .appendTo(vSelDrink);
                })
            },
            error: (err) => {
                console.log(err.responseText);
            }
        })
    }

    //khi nút chi tiết được bấm
    $(document).on("click", ".btn-details", function () {
        getOrderIdOnTable(this);
        $("#titleModalOrderId").html(gOrderIdOnClick.orderId);
        getOrderByOrderId(gOrderIdOnClick.orderId);

    })

    //khi nút confirm trên modal được bấm
    $(document).on("click", ".btnModal-confirm", function () {
        let vStatus = "confirmed";
        onOrderUpdate(vStatus);
        statusUpdate(vStatus);
    })

    //khi nút cancel trên modal được bấm
    $(document).on("click", ".btnModal-cancel", function () {
        let vStatus = "cancel";
        onOrderUpdate(vStatus);
        statusUpdate(vStatus);
    })


    //hàm ghi dữ liệu vào modal chi tiết
    function showDataModal(paramOrder) {
        console.log(paramOrder);
        let vKeys = Object.keys(paramOrder);
        $("#modalOrderDetails :input:text,select").each((index, elem) => {
            $(elem).val(paramOrder[vKeys[index]]);
        })
        $("#modalDetail-ngayTao").val(new Date(paramOrder.ngayTao).toLocaleString());
        $("#modalDetail-ngayCapNhat").val(new Date(paramOrder.ngayCapNhat).toLocaleString());
        $("#modalOrderDetails").modal("show");
    }

    //hiển thị kết quả
    function statusUpdate(paramStatus) {
        $("#modalOrderDetails").modal("hide");
        if (paramStatus === "confirmed") {
            $("#modalStatus-h1")
                .attr("class", "text-success text-center")
                .html(`Đã chấp nhận đơn hàng: ${gOrderIdOnClick.orderId}`);
        }
        if (paramStatus === "cancel") {
            $("#modalStatus-h1")
                .attr("class", "text-danger text-center")
                .html(`Đã hủy đơn hàng: ${gOrderIdOnClick.orderId}`);
        }
        $("#modalStatusUpdateSuccess").modal("show");
    }


    /* KHU VỰC HÀM DÙNG CHUNG */

    //hàm cập nhật đơn hàng
    function onOrderUpdate(paramStatus) {
        let vStatus = {
            trangThai: paramStatus
        };
        $.ajax({
            type: "PUT",
            url: gPIZZA_URL + "/orders/" + gOrderIdOnClick.id,
            dataType: "json",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(vStatus),
            async: false,
            success: function (response) {
                getAllOrder();
                console.log(response);
            },
            error: function (err) {
                console.log(err.responseText);
            }
        })
    }

    //lấy đơn hàng bằng order id
    function getOrderByOrderId(paramOrderId) {
        $.ajax({
            url: gPIZZA_URL + "/orders/" + paramOrderId,
            type: "GET",
            dataType: "json",
            async: false,
            success: function (response) {
                gOrderIdOnClick.id = response.id;
                showDataModal(response);
            },
            error: function (err) {
                console.log(err.responseText);
            }
        })
    }


    //Lấy thông tin Order ID khi bấm nút
    function getOrderIdOnTable(paramBtn) {
        //tìm đến ô chứa orderId
        let vThisOrderId = $(paramBtn).parents("tr").find("td:eq(0)").html();
        gOrderIdOnClick.orderId = vThisOrderId;
    }


    //hàm tải dữ liệu vào bảng
    function loadOrderToTable(paramOrders) {
        gOrderTable.clear();
        gOrderTable.rows.add(paramOrders);
        gOrderTable.draw();
    }
})