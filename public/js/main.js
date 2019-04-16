var recordedData, universalButton, newSentenceButton, discardButton, uploadButton, timer, player;
var newlyRecorded = true;
$(document).ready(() => {
  $.ajaxSetup({
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
  });
  var recorder = new WzRecorder({
    onRecordingStop: function(blob) {
      player[0].src = URL.createObjectURL(blob);
      recordedData = blob;
    },
    onRecording: function(milliseconds) {
      updateClock(milliseconds);
    }
  });
  // wire up the microphone button to toggle recording
  var universalState = "Idle";
  $('#universal').click(function() {
    if (universalState == "Idle") {
      recorder.start();
      universalState = "Recording";
      universalButton.addClass('btn-danger');
      universalButton.removeClass('btn-success');
      universalButton.text(' Dừng');
      universalButton.prepend('<i class="fa fa-stop"></i>');
    } else if (universalState == "Recording") {
      recorder.stop();
      newlyRecorded = true;
      universalState = "Recorded";
      universalButton.addClass('btn-primary');
      universalButton.removeClass('btn-danger');
      universalButton.text(" Nghe lại");
      universalButton.prepend('<i class="fa fa-play"></i>');
      discardButton.prop('disabled', false);
      uploadButton.prop('disabled', false);
    } else if (universalState == "Recorded") {
      player[0].pause();
      player[0].currentTime = 0;
      player[0].play();
    }
  });
  $('#discard').click(function() {
    player[0].pause();
    player[0].currentTime = 0;
    universalState = "Idle";
    discardButton.prop('disabled', true);
    uploadButton.prop('disabled', true);
    universalButton.addClass('btn-success');
    universalButton.removeClass('btn-primary');
    universalButton.text(' Ghi âm');
    universalButton.prepend('<i class="fa fa-circle"></i>');
  });
  $('#upload').click(function() {
    newSentenceButton.prop('disabled', true);
    universalButton.prop('disabled', true);
    discardButton.prop('disabled', true);
    uploadButton.prop('disabled', true);
    $('#upload-failed').addClass('d-none');
    $('#uploading').removeClass('d-none');
    var fd = new FormData();
    fd.append($('input[name=_sentence]')[0].value, recordedData);
    $.ajax({
      type: 'POST',
      url: '/sentence/upload',
      data: fd,
      processData: false,
      contentType: false
    }).done(function(data) {
      $('#uploading').removeClass('d-none');
      if (data.error) {
        $('#upload-failed').removeClass('d-none');
        newSentenceButton.prop('disabled', false);
        
        universalButton.prop('disabled', false);
        discardButton.prop('disabled', false);
        uploadButton.prop('disabled', false);
      } else {
        $('#uploading').addClass('d-none');
        $('#upload-succeeded').removeClass('d-none');
        setTimeout(() => {
          window.location.replace("/")
        }, 1000);
      }
    }).fail(function(error) {
      $('#uploading').addClass('d-none');
      $('#upload-failed').removeClass('d-none');
      newSentenceButton.prop('disabled', false);
      universalButton.prop('disabled', false);
      discardButton.prop('disabled', false);
      uploadButton.prop('disabled', false);
    });
  });
  $('button.timeline-icon').each(function(key, button) {
    $(button).click(function() {
      var path = $(this).find("input")[0].value
      $('#player')[0].src = '/' + path;
      $('#player')[0].currentTime = 0;
      $('#player')[0].play();
    })
  });
  universalButton = $("#universal");
  newSentenceButton = $('#new_sentence');
  discardButton = $('#discard');
  uploadButton = $('#upload');
  timer = $("#timer");
  player = $("#player");
  newlyRecorded = true;
  universalButton.prop('disabled', false);
  newSentenceButton.prop('disabled', false);
  
  
});

function playerUpdate() {
  if (newlyRecorded) {
    newlyRecorded = false;
  } else {
    updateClock(player[0].currentTime * 1000);
  }
}

function updateClock(time) {
  var seconds = time / 1000;
  var minutes = Math.floor(seconds / 60);
  seconds = Number(seconds - minutes * 60).toFixed(3);
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  timer.html(minutes + ":" + seconds);
}