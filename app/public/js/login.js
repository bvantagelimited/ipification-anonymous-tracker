$(document).ready(function(){
  $(".phone-input input").on('keyup', function() {
    var value = this.value;
    if(value && value.length > 0){
      $('.login-container').addClass('valid')
    }else{
      $('.login-container').removeClass('valid')
    }
  });

  $('.btn-login').on('click', function(){
    var value = $(".phone-input input").val();
    if(value && value.length > 0){
      window.location.href = window.ROOT_URL + '/authentication?phone=' + value;
    }
  })

  var urlParams = new URLSearchParams(window.location.search);
  if(urlParams.has('error')){
    alert("Your phone invalid")
  }
})