var newSentenceTextButton;
const params = new URL(window.location.href).pathname.split("/");
const sentenceTextId = params[params.length - 1];



$(document).ready(() => {
	$.ajaxSetup({
	  headers: {
		'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
	  }
	});
	console.log("loz2");
	
	$('#new_sentenceText').click(function() {
		console.log("loz1");
		
		getRandomQuestion();
	});
});
function getRandomQuestion() {
	$.ajax({
		url: "/sentenceText/randomText",
		type: "GET",
		success: function(response) {
			if(response) {
				console.log(response);
				console.log("loa");
				// $("#questionContent").text(response.questionContent);
				// $(".answer_btn").data("questionid", response._id);
				// $("#viewDetail").attr("href", "/question/"+response._id);
			}
		},
		error: function(err) {
			console.log(err);
		}
	});
}