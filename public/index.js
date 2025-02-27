const MDCList = mdc.list.MDCList;

const list = MDCList.attachTo(document.querySelector('.mdc-deprecated-list'));
list.wrapFocus = true;

// Drawer Destination click listener
$('.mdc-deprecated-list-item').on('click', (evt) => {
    let content = $('#content');

    switch (evt.target.id) {
        case 'destination-my-trip':
            content.html('<h1>My Trip</h1>');
            break;
        case 'destination-explore':
            content.load('/hotels.html');
            break;
        case 'destination-calendar':
            // TODO: Causing an error: "Identifier 'button' has already been declared"
            content.load('/calendar.html');
            break;
        // TODO: Load page $('#content').load('/my_trip.html');
    }
});