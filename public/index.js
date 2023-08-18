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
            content.html('<h1>Explore</h1>');
            break;
        case 'destination-calendar':
            content.html('<h1>Calendar</h1>');
            break;
        case 'destination-budget':
            content.html('<h1>Budget</h1>');
            break;
        // TODO: Load page $('#content').load('/my_trip.html');
    }
});

// TODO: Could use drawer listener or below to load page
// $(window).on('hashchange', (e) => {
//     console.log(`Location: ${e.target.location.hash.split('/')[1]}`);
// });