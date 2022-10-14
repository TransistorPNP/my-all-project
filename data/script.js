"use strict";

$(document).ready(function () {


    //Biến toàn cục
    var gComboSizeObject = {
        kichThuoc: "", //S/M/L
        duongKinh: 0,
        suon: 0,
        salad: 0,
        soLuongNuocNgot: 0,
        thanhTien: 0
    };
    var gLoaiPizza = "";

    var gPhantramGiamGia = 0;

    var gOrderDetail = null;

    var gOrderID = {
        id: "",
        orderId: ""
    };

    const gPIZZA_URL = "http://42.115.221.44:8080/devcamp-pizza365";
    const gVOUCHER_URL = "http://42.115.221.44:8080/devcamp-voucher-api/voucher_detail/";


    //xử lý các sự kiện

    //khi combo s được chọn
    $("#btn-combo-s").on("click", function () {
        comboSelected("S", 25, 2, 200, 2, 150000);
        changeBtnColor("s");
    })

    //khi combo m được chọn
    $("#btn-combo-m").on("click", function () {
        comboSelected("M", 30, 4, 300, 3, 200000);
        changeBtnColor("m");
    })

    //khi combo l được chọn
    $("#btn-combo-l").on("click", function () {
        comboSelected("L", 35, 8, 500, 4, 250000);
        changeBtnColor("l");
    })

    //khi các loại pizza được chọn
    $("#btn-bacon").on("click", function () {
        gLoaiPizza = "BACON";
        changeBtnColor("bacon");
        console.log("Loại pizza đã chọn là: %s", gLoaiPizza);
    })

    $("#btn-hawaii").on("click", function () {
        gLoaiPizza = "HAWAII";
        changeBtnColor("hawaii");
        console.log("Loại pizza đã chọn là: %s", gLoaiPizza);
    })

    $("#btn-seafood").on("click", function () {
        gLoaiPizza = "SEAFOOD";
        changeBtnColor("seafood");
        console.log("Loại pizza đã chọn là: %s", gLoaiPizza);
    })

    //khi nút gửi đơn hàng được bấm
    $(document).on("click", "#btn-send-order", function () {
        onBtnSendOrderClick();
    })

    //Lấy danh sách đồ uống
    $.ajax({
        type: "GET",
        url: gPIZZA_URL + "/drinks",
        dataType: "json",
        success: function (response) {
            loadDrinksToOption(response);
        },
        error: function (err) {
            console.log(err.responseText);
        }
    });

    //khi nút tạo đơn trên modal thông tin đơn hàng được bấm
    $("#modalOrderInfo").on("click", "#btn-modal-create-order", function () {
        $("#modalOrderInfo").modal("hide");
        let vOrderDataRequest = {
            kichCo: gComboSizeObject.kichThuoc,
            duongKinh: gComboSizeObject.duongKinh,
            suon: gComboSizeObject.suon,
            salad: gComboSizeObject.salad,
            loaiPizza: gLoaiPizza,
            idVourcher: gOrderDetail.maGiamGia,
            idLoaiNuocUong: gOrderDetail.doUong,
            soLuongNuoc: gComboSizeObject.soLuongNuocNgot,
            hoTen: gOrderDetail.hoTen,
            thanhTien: gComboSizeObject.thanhTien,
            email: gOrderDetail.email,
            soDienThoai: gOrderDetail.soDienThoai,
            diaChi: gOrderDetail.diaChi,
            loiNhan: gOrderDetail.loiNhan
        };
        createOrder(vOrderDataRequest);
        $("#modalSuccess").modal("show");
    })

    //sự kiện click nút gửi đơn hàng
    function onBtnSendOrderClick() {
        //khởi tạo biến lưu trữ đối tượng
        let vOrderData = {
            hoTen: "",
            email: "",
            soDienThoai: "",
            diaChi: "",
            maGiamGia: "",
            loiNhan: "",
            doUong: ""
        };

        //gọi hàm lấy dữ liệu từ input
        getInputData(vOrderData);
        //nếu dữ liệu hợp lệ
        if (dataValid(vOrderData)) {
            console.log("Dữ liệu hợp lệ, có thể đặt đơn");
            if (vOrderData.maGiamGia != "") {
                checkVoucher(vOrderData);
                console.log("Phần trăm giảm giá: %s", gPhantramGiamGia);
            }
            showDataToModalOrder(vOrderData, gPhantramGiamGia);
            $("#modalOrderInfo").modal("show");

            gOrderDetail = vOrderData;

        }

    }

    //hàm gọi server tạo đơn hàng
    function createOrder(paramOrderDetails) {
        console.log(paramOrderDetails);
        $.ajax({
            url: gPIZZA_URL + "/orders",
            type: "POST",
            dataType: "json",
            data: JSON.stringify(paramOrderDetails),
            contentType: "application/json;charset=UTF-8",
            async: false,
            success: function (res) {
                console.log(res);
                $("#modalOrderSuccess").val(res.orderId);
                gOrderID.id = res.id;
                gOrderID.orderId = res.orderId;
            },
            error: function (err) {
                console.log(err.responseText);
            }
        })
    }

    //hiển thị thông tin đơn hàng ra modal
    function showDataToModalOrder(paramOrderData, paramPercentDiscount) {
        let vPhaiThanhToan = gComboSizeObject.thanhTien * ((100 - paramPercentDiscount) / 100);
        $("#hoTenModalOrder").val(paramOrderData.hoTen);
        $("#soDienThoaiModalOrder").val(paramOrderData.soDienThoai);
        $("#diaChiModalOrder").val(paramOrderData.diaChi);
        $("#loiNhanModalOrder").val(paramOrderData.loiNhan);
        $("#detailsModalOrder").val(`Xác nhận: ${paramOrderData.hoTen}, ${paramOrderData.soDienThoai}, ${paramOrderData.diaChi}
        Menu: ${gComboSizeObject.kichThuoc}, sườn nướng: ${gComboSizeObject.suon}, nước: ${gComboSizeObject.soLuongNuocNgot}, ...
        Loại Pizza: ${gLoaiPizza}, Giá: ${gComboSizeObject.thanhTien}, Mã giảm giá: ${paramOrderData.maGiamGia}
        Phải thanh toán: ${vPhaiThanhToan} (giảm giá ${gPhantramGiamGia} %)`);

    }


    /*/khu vực hàm dùng chung*/

    //kiểm tra mã giảm giá
    function checkVoucher(paramOrderData) {
        $.ajax({
            url: gVOUCHER_URL + paramOrderData.maGiamGia,
            type: "GET",
            dataType: "json",
            async: false,
            success: function (resSuccess) {
                $("#maGiamGiaModalOrder").val(paramOrderData.maGiamGia);
                gPhantramGiamGia = resSuccess.phanTramGiamGia;
            },
            error: function (err) {
                console.log(err.responseText);
                gPhantramGiamGia = 0;
                paramOrderData.maGiamGia = "";
                $("#maGiamGiaModalOrder").val("Không tồn tại mã này");
            }
        })
    }

    //kiểm tra dữ liệu hợp lệ
    function dataValid(paramObjectOrder) {

        //kiểm tra đã chọn combo Pizza chưa
        if (gComboSizeObject.kichThuoc === "") {
            alert("Hãy chọn combo trước khi đặt đơn");
            throw new Error("Chưa chọn combo Pizza");
        }
        //kiểm tra đã chọn loại Pizza chưa
        if (gLoaiPizza === "") {
            alert("Hãy chọn loại Pizza bạn muốn");
            throw new Error("Chưa chọn loại Pizza");
        }
        //kiểm tra đồ uống đã đươc chọn chưa
        if ($("#idLoaiDoUong").val() == 0) {
            alert("Chưa chọn loại nước uống");
            throw new Error("Chưa chọn loại đồ uống");
        }

        if (paramObjectOrder.hoTen.trim() == "") {
            alert("Chưa điền họ tên");
            throw new Error("Tên đang bị trống");
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(paramObjectOrder.email))) {
            alert("Email chưa đúng định dạng");
            throw new Error("Email sai định dạng");
        }
        if (!(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(paramObjectOrder.soDienThoai))) {
            alert("Số điện thoại chưa đúng");
            throw new Error("Số điện thoại chưa đúng");
        }
        if (paramObjectOrder.diaChi.trim() == "") {
            alert("Chưa điền địa chỉ");
            throw new Error("Địa chỉ trống");
        }
        return true
    }

    //lấy dữ liệu từ input
    function getInputData(paramOrderData) {
        let vKeys = Object.keys(paramOrderData);
        $("form#formOrder :input:text").each(function (index, elem) {
            paramOrderData[vKeys[index]] = $(elem).val();
        })
        paramOrderData.doUong = $("#idLoaiDoUong").val();
    }

    //tải danh sách đồ uống vào options
    function loadDrinksToOption(paramDrinksObject) {
        let vSelectDrinks = $("#idLoaiDoUong");
        $(paramDrinksObject).each((_index, elems) => {
            $("<option>").val(elems.maNuocUong)
                .html(elems.tenNuocUong)
                .appendTo(vSelectDrinks);
        })

    }

    //hàm đổi màu nút bấm 
    function changeBtnColor(paramBtn) {
        let vSBtn = $("#btn-combo-s");
        let vMBtn = $("#btn-combo-m");
        let vLBtn = $("#btn-combo-l");
        let vBacon = $("#btn-bacon");
        let vHawaii = $("#btn-hawaii");
        let vSeafood = $("#btn-seafood");

        if (paramBtn == "s") {
            $(vSBtn).attr("class", "btn btn-success w-100");
            $(vMBtn).attr("class", "btn btn-warning w-100");
            $(vLBtn).attr("class", "btn btn-warning w-100");
        }

        if (paramBtn == "m") {
            $(vSBtn).attr("class", "btn btn-warning w-100");
            $(vMBtn).attr("class", "btn btn-success w-100");
            $(vLBtn).attr("class", "btn btn-warning w-100");
        }

        if (paramBtn == "l") {
            $(vSBtn).attr("class", "btn btn-warning w-100");
            $(vMBtn).attr("class", "btn btn-warning w-100");
            $(vLBtn).attr("class", "btn btn-success w-100");
        }

        if (paramBtn == "bacon") {
            $(vBacon).attr("class", "btn btn-success w-100");
            $(vHawaii).attr("class", "btn btn-warning w-100");
            $(vSeafood).attr("class", "btn btn-warning w-100");
        }
        if (paramBtn == "seafood") {
            $(vBacon).attr("class", "btn btn-warning w-100");
            $(vHawaii).attr("class", "btn btn-warning w-100");
            $(vSeafood).attr("class", "btn btn-success w-100");
        }
        if (paramBtn == "hawaii") {
            $(vBacon).attr("class", "btn btn-warning w-100");
            $(vHawaii).attr("class", "btn btn-success w-100");
            $(vSeafood).attr("class", "btn btn-warning w-100");
        }
    }

    //hàm lưu trữ combo khi được chọn
    function comboSelected(paramKichThuoc, paramDuongKinh, paramSuon, paramSalad, paramSLNuoc, paramPrice) {
        gComboSizeObject = {
            kichThuoc: paramKichThuoc,
            duongKinh: paramDuongKinh,
            suon: paramSuon,
            salad: paramSalad,
            soLuongNuocNgot: paramSLNuoc,
            thanhTien: paramPrice
        };
        console.log(gComboSizeObject);
    }

    //khi bấm back to top sẽ chạy về đầu trang
    $("#btn-scroll-top").on("click", function () {
        $("html, body").animate({ scrollTop: 0 }, "slow");
        return false;
    })

});
