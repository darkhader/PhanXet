const params = new URL(window.location.href).pathname.split("/");
const sentenceTextId = params[params.length - 1];



$(document).ready(() => {
	$.ajaxSetup({
	  headers: {
		'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
	  }
	});
	
	
	$('.get_Text').click(function() {
		console.log("textId", $(this).data().textid);
		
	
        window.location.href = "/sentenceText/getText/"+$(this).data().textid;
				
	
});
$('#comeBack').click(function() {

	history.back();

});
$('.answer_btn').click(function() {
console.log(sentenceTextId);

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
