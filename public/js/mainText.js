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
$('#mySelect').change(function() {

  console.log($(this).find(':selected').data());
	
	$.ajax({
		url: "/sentenceText/judge/"+sentenceTextId ,
		type: "PUT",
		data: $(this).find(':selected').data(),
		success: function(response) {
			if(response) {
			console.log(response);
			document.write(response);
			$('#myModal').modal("show")
			
			}
		},
		error: function(err) {
			console.log(err);
		}
	});
	$.ajax({
		url: "/sentenceText/get/"+sentenceTextId ,
		type: "GET",
		
		success: function(response) {
			if(response) {
			console.log(response);
			if(response.userChoose){
				$('#myErrorModal').modal("show")
			}
		

			
			}
		},
		error: function(err) {
			console.log(err);
		}
	});
	
});
$('#report').click(function() {


	$.ajax({
		url: "/sentenceText/report/"+sentenceTextId ,
		type: "PUT",
		
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
