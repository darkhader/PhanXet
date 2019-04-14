$(document).ready(() => {
  $(".clickable").each(function(key, button) {
    $(button).click(function() {
      var action = $(this).attr("action");
      var target = $(this).attr("target");
      $.ajax({
        type: 'GET',
        url: '/sentence/report/' + action + '/' + target,
        processData: false,
        contentType: false
      }).done(function(result) {
      	if (result.error) {
      		alert("Có gì đó không đúng. Bạn không thể thực hiện tác vụ này");
      	} else {
      		$(button).removeClass("clickable text-secondary").addClass("text-info");
      	}
      }).fail(function(error) {
      	alert("Network error.");
      })
    });
  });
});