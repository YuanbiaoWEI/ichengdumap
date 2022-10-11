//设置系统时间
setInterval(getTime,1000);

//左侧下拉菜单控制
$(function () {
    var width = $(".leftsidebar_box").width();
    $(".iframe_wrapper").css("margin-left", width);
    $(".leftsidebar_box dd").hide(); //隐藏
    /**系统默认显示第一行菜单**/
    $(".first_dt").parent().find('dd').show(); // 默认显示第一行菜单   
    $(".first_dt").css("background-image", "url(img/left/MinusSign.png)");    
    /**一级菜单项单击事件**/
    $(".leftsidebar_box dt").click(function () {
        //判断当前一级菜单下的二级菜单项是否隐藏
        if ($(this).parent().find('dd').is(":hidden")) {
            $(this).parent().find('dd').slideToggle(); //滑动方式展开子菜单                              
            $(this).css("background-image", "url(img/left/MinusSign.png)");
        }
        else {
            $(this).parent().find('dd').slideUp(); //滑动方式隐藏子菜单                
            $(this).css("background-image", "url(img/left/AddSign.png)");
        }
    });

    /**二级菜单项单击事件**/
    $(".leftsidebar_box dd").click(function () {
        //改变当前按钮的样式(选中状态)
        $(this).parent().parent().find('dl').find("dd").css("color", "");
        $(this).parent().parent().find('dl').find("dd").css("font-weight", "");
        $(this).css("color", "#63b400");
        $(this).css("font-weight", "bold");
    });
    

    $(".leftsidebar_box").css("width", width);
})

/**系统初始默认页面源码显示 **/
$(function () {    
    setCore("chengdumap"); //显示默认页面的源码
})

/** 二级菜单项对应功能页面的源码显示 **/
function setCore(name) {
    var htmlUrl = "html/"  + name + ".html"; //请求的页面
    $('#container_iframe').attr("src", htmlUrl); //设置右侧容器的页面地址   
}

function refreshpage() {
    location.reload(true);
  }

function getTime(){
        var myDate = new Date();
        var myYear = myDate.getFullYear(); //获取完整的年份(4位,1970-????)
        var myMonth = myDate.getMonth()+1; //获取当前月份(0-11,0代表1月)
        var myToday = myDate.getDate(); //获取当前日(1-31)
        var myDay = myDate.getDay(); //获取当前星期X(0-6,0代表星期天)
        var myHour = myDate.getHours(); //获取当前小时数(0-23)
        var myMinute = myDate.getMinutes(); //获取当前分钟数(0-59)
        var mySecond = myDate.getSeconds(); //获取当前秒数(0-59)
        var week = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        var nowTime;

        nowTime = myYear+'年'+fillZero(myMonth)+'月'+fillZero(myToday)+'日'+'&nbsp;&nbsp;'+fillZero(myHour)+':'+fillZero(myMinute)+':'+fillZero(mySecond)+'&nbsp;&nbsp;'+week[myDay]+'&nbsp;&nbsp;';
        //console.log(nowTime);
        $('#time').html(nowTime);
};
function fillZero(str){
    var realNum;
    if(str<10){
        realNum	= '0'+str;
    }else{
        realNum	= str;
    }
    return realNum;
}








