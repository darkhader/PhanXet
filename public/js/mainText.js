var newSentenceTextButton;
const params = new URL(window.location.href).pathname.split("/");
const sentenceTextId = params[params.length - 1];



$(document).ready(() => {
	$.ajaxSetup({
	  headers: {
		'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
	  }
	});
	
	
	$('.answer_btn').click(function() {
		
		$.ajax({
			url: "/sentenceText/judge/"+sentenceTextId ,
			type: "PUT",
			data: $(this).data(),
			success: function(response) {
				if(response) {
				console.log(response);
				document.write(response);
 
				
				}
			},
			error: function(err) {
				console.log(err);
			}
		});
	});
});
function judgeQuestion() {
	
	
	
}