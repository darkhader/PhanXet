$(document).ready(() => {
	$.ajaxSetup({
	  headers: {
		'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
	  }
	});
$('#comeBack').click(function() {

	history.back();

});
$('.mySelect').change(function() {

  console.log($(this).find(':selected').data());
	
	$.ajax({
		url: "/sentenceText/judge" ,
		type: "PUT",
		data: $(this).find(':selected').data(),
		success: function(response) {
			if(response) {
			console.log("res",response);
			
			$('#myModal').modal("show")
			
			}
		},
		error: function(err) {
			console.log(err);
		}
	});
	$.ajax({
		url: "/sentenceText/getOne" ,
		type: "PUT",
		data: $(this).find(':selected').data(),
		
		success: function(response) {
			if(response) {
			console.log(response);
			if(response){
				if(response.userChoose){
					$('#myErrorModal').modal("show")
				}
			}
			
		

			
			}
		},
		error: function(err) {
			console.log(err);
		}
	});
	
});
$('.report').click(function() {


	$.ajax({
		url: "/sentenceText/report" ,
		type: "PUT",
		data: $(this).find(':selected').data(),
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
