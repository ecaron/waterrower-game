/* global jQuery, fetch, Avataaars, alert, confirm, bootstrap */
function prettyDuration (duration, briefUnits) {
  if (!briefUnits) briefUnits = false
  duration = Math.round(duration / 1000)
  let output = ''; let i
  if (duration >= 3600) {
    i = Math.floor(duration / 3600)
    if (briefUnits) output += i + 'h'
    else output += i + ((i > 1) ? ' hours, ' : ' hour, ')
    duration -= i * 3600
  }
  if (duration >= 60 || output !== '') {
    i = Math.floor(duration / 60)
    if (briefUnits) output += i + 'm'
    else output += i + ((i > 1) ? ' minutes, ' : ' minute, ')
    duration -= i * 60
  }
  if (duration === 0) return output.replace(/[,\s]*$/, '')
  else if (briefUnits) return output + duration + 's'
  else return output + duration + ((duration === 1) ? ' second' : ' seconds')
}

function prettyDistance (distance, briefUnits) {
  if (!briefUnits) briefUnits = false
  let distanceValue
  if (typeof distance === 'string') distance = parseFloat(distance)
  if (distance > 1000) {
    distanceValue = parseFloat((distance / 1000).toFixed(2))
    distanceValue += (briefUnits === true) ? 'km' : ' kilometers'
  } else {
    distanceValue = Math.round(distance)
    distanceValue += (briefUnits === true) ? 'm' : ' meters'
  }
  return distanceValue
}

function getRandomInt (max) { // eslint-disable-line no-unused-vars
  return Math.floor(Math.random() * max)
}

jQuery(function () {
  const $ = jQuery
  const logout = document.querySelector('#logout')

  if (logout) {
    logout.onclick = function () {
      fetch('/logout', { method: 'DELETE', credentials: 'same-origin' })
        .then(function () {
          window.location = '/'
        })
    }
  }

  const $intro = $('#intro')
  if ($intro.length && $intro.hasClass('d-block')) {
    $('#main').hide().removeClass('d-none')
    setTimeout(function () {
      setTimeout(function () {
        $intro.hide()
        $('#main').show()
      }, 500)
      $intro.addClass('animate__animated animate__zoomOut')
    }, 4000)
  }

  $('.delete-rower').on('click', function (e) {
    e.preventDefault()
    if (confirm('Are you sure?')) {
      fetch('/rower/' + $(this).data('rower'), { method: 'DELETE', credentials: 'same-origin' })
        .then(response => response.json())
        .then(response => {
          if (response.error) alert(response.error)
          else window.location = '/'
        })
    }
    return false
  })
  $('.info-rower').on('click', function (e) {
    e.preventDefault()
    $('.modal .modal-body').html('Loading...')
    appModal.show()
    let infoPath = '/rower/' + $(this).data('rower') + '/logbook'
    if ($('#race-mode').val()) {
      infoPath += '?mode=' + $('#race-mode').val()
    }
    fetch(infoPath, { method: 'GET', credentials: 'same-origin' })
      .then(response => response.text())
      .then(response => {
        $('.modal .modal-body').html(response)
        $('.modal .modal-body .duration').each(function () {
          const value = $(this).data('value')
          $(this).text(prettyDistance(value), true)
        })
      }).catch(e => {
        $('.modal .modal-body').html('Sorry. Some error happened.')
        console.log(e)
      })
    return false
  })
  $('.avatar').each(function () {
    const avatar = $(this).data('details')
    const options = { style: 'none' }
    Object.keys(avatar).forEach(function (key) {
      if (avatar[key]) {
        options[key] = avatar[key]
      }
    })
    const svg = Avataaars.create(options)
    $(this).html(svg)
  })
  $('.prettyDuration').each(function () {
    $(this).text(prettyDuration($(this).data('value')))
  })
  $('.prettyDistance').each(function () {
    $(this).text(prettyDistance($(this).data('value')))
  })
  const appModal = new bootstrap.Modal(document.getElementById('modal-1'), {
    keyboard: false
  })

  const rowers = {}
  $('.rower-box').each(function () {
    const rowerId = $(this).data('id')
    if (rowerId) {
      rowers[rowerId] = {}
      $(this).data('records').forEach(function (record) {
        rowers[rowerId][record.mode] = record
      })
    }
  })

  $('#race-mode').on('change', function () {
    const raceMode = $(this).val()
    if (raceMode) {
      $('.race-mode').val($(this).val())
      $('#race-alone').removeClass('disabled').addClass('hover')
      Object.keys(rowers).forEach(function (rowerId) {
        const $rowerBox = $('#rower-box-' + rowerId)
        let raceText
        if (rowers[rowerId][raceMode]) {
          $rowerBox.removeClass('disabled order-last').addClass('hover order-2')
          if (raceMode === 'marathon' || raceMode.substring(0, 4) === 'time') {
            raceText = prettyDistance(rowers[rowerId][raceMode].distance)
          } else {
            raceText = prettyDuration(rowers[rowerId][raceMode].duration)
          }
          $rowerBox.find('.record-details').html(raceText)
        } else {
          $rowerBox.addClass('disabled order-last').removeClass('hover order-2')
          $rowerBox.find('.record-details').html('')
        }
      })
    }
  })
  $('#race-mode').trigger('change')

  const $currentTime = $('.current-time')
  if ($currentTime.length) {
    setTimeout(function () {
      setInterval(function () {
        const time = new Date()
        $currentTime.html(time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }))
      }, 60 * 1000)
      const time = new Date()
      $currentTime.html(time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }))
    }, (60 - (new Date()).getSeconds()) * 1000)
    const time = new Date()
    $currentTime.html(time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }))
  }
})
