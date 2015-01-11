$('#upload').click(function(e) {
    e.preventDefault();
    $('#up-input').click();
})

$('#up-input').change(function(e) {
    e.preventDefault();
    $('#upload-form').submit();
})