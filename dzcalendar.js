'use strict';

const slice = Array.prototype.slice

const findParent = (elem, id) => {
    
  while(elem.parentNode) {

    elem = elem.parentNode

    if(elem == document.body || elem == document)
      return undefined

    if(elem.getAttribute('id') == id)
      return elem

  }

  return undefined
}

(() => {

  const getCalendar = () => {

    let calendar = document.getElementById("dz-calendar")
    return calendar

  }
  
  const isInCalendar = (elem) => {
    
    let parent = findParent(elem, 'dz-calendar')
    
    return parent != document.body && parent != undefined
    
  }

  const getDaysArrayByMonth = (date) => {
    date = moment(date, 'YYYY-MM')
    let monthRange = date.range('month')
    let days = []

    monthRange.by('days', (moment) => {
      days.push(moment)
    })

    return days
  }

  const getMonthName = (idx) => {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].splice(idx, 1)
  }

  const drawDates = (dates) => {

    let now = moment()
    let markup = `<div class="dz-dates">`
    let calendar = getCalendar()
    let maxDate, minDate
    
    if(calendar && calendar.dataset.maxDate)
      maxDate = moment(calendar.dataset.maxDate)
      
    if(calendar && calendar.dataset.minDate)
      minDate = moment(calendar.dataset.minDate)

    // find offset of first date.
    let offsetDay = dates[0].day()

    dates.forEach((date, idx) => {

      let classes = [];
      
      // check if the date is today
      if (date.isSame(now, 'd'))
        classes.push('today')
        
      // check if the date is within the min range, if one is set
      if(minDate && minDate.diff(date, 'days') > 0)
        classes.push('disabled')
        
      // check if the date is within the max range, if one is set
      if(maxDate && maxDate.diff(date, 'days') < 0)
        classes.push('disabled')
        
      classes = classes.join(' ')

      if (idx != 0)
        markup += `<div role="button" class="${classes}">${date.date()}</div>`
      else
        markup += `<div style="margin-left:${offsetDay * 35}px;" role="button" class="${classes}">${date.date()}</div>`

    })

    markup += `</div>`

    return markup

  }

  const drawCalendar = function() {

    let now = moment()
    let month = moment(now, 'YYYY-MM')
    let dates = getDaysArrayByMonth(month)
    let days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    let markup = `<div id="dz-calendar" data-current=${now.format("YYYY-MM")}>
      <div class="dz-title">
         <h4>${getMonthName(month.month())}, ${month.year()}</h4>
         <button id="dz-prev"><</button>
         <button id="dz-next">></button>
      </div>
      <div class="dz-days">`

    days.forEach((day) => {
      markup += `<div>${day}</div>`
    })

    markup += `</div>
      ${drawDates(dates)}
    </div>`

    return markup
  }
  
  const cleanUpCalendar = (evt, calendar) => {
    
    evt && evt.preventDefault()
    
    if(calendar) {
      
      calendar.classList.remove('active')
      
      setTimeout(() => {
        document.body.removeChild(calendar)
      }, 300)
      
    }

    document.body.removeEventListener('click', bodyClick, false)

    return false
  }
  
  const prevClick = (evt) => {

    evt && evt.preventDefault()
    
    let calendar = getCalendar()
    let current = moment(calendar.dataset.current, 'YYYY-MM')
    let previous = new moment(current).subtract(1, 'months')

    let newDates = drawDates(getDaysArrayByMonth(previous))
    let currentDates = calendar.children[2]
    
    calendar.insertAdjacentHTML('beforeEnd', newDates)
    newDates = calendar.children[3]
    
    calendar.removeChild(currentDates)
    
    calendar.dataset.current = previous.format('YYYY-MM')
    calendar.children[0].children[0].innerHTML = `${getMonthName(previous.month())}, ${previous.year()}`
    
    hookDates()

    return false

  }
  
  const nextClick = (evt) => {

    evt && evt.preventDefault()
    
    let calendar = getCalendar()
    let current = moment(calendar.dataset.current, 'YYYY-MM')
    let next = new moment(current).add(1, 'months')

    let newDates = drawDates(getDaysArrayByMonth(next))
    let currentDates = calendar.children[2]
    
    calendar.insertAdjacentHTML('beforeEnd', newDates)
    newDates = calendar.children[3]
    
    calendar.removeChild(currentDates)
    
    calendar.dataset.current = next.format('YYYY-MM')
    calendar.children[0].children[0].innerHTML = `${getMonthName(next.month())}, ${next.year()}`
    
    hookDates()

    return false

  }
  
  const bodyClick = (evt) => {
    
    let calendar = getCalendar()
    
    if(calendar)
      if(!calendar.classList.contains('active'))
        document.body.removeChild(calendar)
      else if(!isInCalendar(evt.target)) {
        return cleanUpCalendar(evt, calendar)
      }
    
    document.body.removeEventListener('click', bodyClick, false);
  
  }
  
  const dateClick = (evt) => {
    
    let calendar = getCalendar()
    let date = parseInt(evt.target.innerHTML)
    date = moment(calendar.dataset.current + '-' + date, 'YYYY-MM-DD')
    
    let fn = window[calendar.dataset.onset]
    fn && fn(date)
    
    return cleanUpCalendar(evt, calendar)
    
  }
  
  const hookDates = () => {
    
    let calendar = getCalendar()
    if(!calendar)
      return
       
    let dates = [].slice.call(calendar.children[2].children)
    dates.forEach((item) => {
      if(!item.classList.contains('disabled'))
        item.addEventListener('click', dateClick, false)
    })
    
  }

  const triggerClick = (evt) => {
    
    // check if calendar is already being shown
    let phantom = getCalendar()
    
    if(phantom) {
      let ignore = cleanUpCalendar(evt, phantom)
      setTimeout(() => {
        triggerClick(evt)
      }, 300)
      return false
    }

    let rect = evt.target.getBoundingClientRect()
    let center = {
      x: rect.left + (rect.width / 2),
      y: rect.top + rect.height
    }

    let calendar = drawCalendar()

    document.body.insertAdjacentHTML('beforeEnd', calendar)

    calendar = document.getElementById('dz-calendar')
    
    // position the calendar near the origin point
    let calendarRect = calendar.getBoundingClientRect()
    
    // the width before showing = actual width * 0.25 
    let width = calendarRect.width * 4

    calendar.style.left = (center.x - width/2) + 'px'
    calendar.style.top = (center.y + 16) + 'px'

    let prev = calendar.children[0].children[1]
    let next = calendar.children[0].children[2]

    prev.addEventListener('click', prevClick, false)
    next.addEventListener('click', nextClick, false)

    calendar.classList.add('active')
    
    if(evt.target.dataset.dateMax)
       calendar.dataset.maxDate = evt.target.dataset.dateMax
       
    if(evt.target.dataset.dateMin)
       calendar.dataset.minDate = evt.target.dataset.dateMin
       
    if(evt.target.dataset.onset)
       calendar.dataset.onset = evt.target.dataset.onset
       
    hookDates()
       
    setTimeout(() => {
      // this needs to be added a second later to prevent ghost click
      document.body.addEventListener('click', bodyClick, false)
    }, 500)

    return false

  }

  let triggers = document.querySelectorAll('.date-trigger')
  triggers = slice.call(triggers)

  triggers.forEach((item) => {
    item.addEventListener('click', triggerClick, false)
  })

})();

(() => {
  
  const getTimer = () => {
    return document.getElementById('dz-timer')
  }
  
  const isInTimer = (elem) => {
    
    let parent = findParent(elem, 'dz-timer')
    
    return parent != document.body && parent != undefined
    
  }
  
  const drawTimer = () => {

    let markup = `<div id="dz-timer">
      <select class="hours">`
    
    // draw hours dropdown
    let hours = Array.from(Array(13).keys())
    hours.shift()
    markup += hours
      .map((item) => {
        return `<option value=${item}>${item}</option>`    
      }).join(' ')
    
    markup += `</select>
      <select class="minutes">`
    
    // draw minutes dropdown
    markup += Array.from(Array(60).keys())
    .map((item) => {
      if(item.toString().length == 1)
        item = '0' + item
      return `<option value=${item}>${item}</option>`
    }).join(' ')
    
    // AM, PM
    markup += `</select>
      <select class="shift">
        <option value=0>AM</option>
        <option value=1>PM</option>
      </select>`
       
    markup +=`</select>
    </div>`
    
    return markup
  
  }
  
  const cleanUpTimer = (evt, timer) => {
    
    evt && evt.preventDefault()
    
    if(timer) {
      
      timer.classList.remove('active')
      
      setTimeout(() => {
        document.body.removeChild(timer)
      }, 300)
      
    }

    document.body.removeEventListener('click', bodyClick, false)

    return false
  }
  
  const bodyClick = (evt) => {
    
    let timer = getTimer()
    
    if(timer)
      if(!timer.classList.contains('active'))
        document.body.removeChild(timer)
      else if(!isInTimer(evt.target)) {
        return cleanUpTimer(evt, timer)
      }
    
    document.body.removeEventListener('click', bodyClick, false);
  
  }
  
  const didChange = (evt) => {
       
    let target = evt.target
    let timer = getTimer()
    
    if(!timer.dataset.onchange)
      return true
    
    let hours = parseInt(timer.children[0].value)
    let minutes = parseInt(timer.children[1].value)
    let shift = parseInt(timer.children[2].value)
    
    if(shift == 1)
      hours += 12
      
    if(hours == 12 && shift == 0)
      hours = '00'
      
    let fn = window[timer.dataset.onchange]
    fn && fn({
      string: hours + ':' + minutes,
      hours: parseInt(hours),
      minutes: minutes
    })
    
  }
  
  const triggerClick = (evt) => {
    
    let phantom = getTimer()
    
    if(phantom) {
      let ignore = cleanUpTimer(evt, phantom)
      setTimeout(() => {
        triggerClick(evt)
      }, 300)
      return false
    }
    
    let rect = evt.target.getBoundingClientRect()
    let center = {
      x: rect.left + (rect.width / 2),
      y: rect.top + rect.height
    }

    let timer = drawTimer()

    document.body.insertAdjacentHTML('beforeEnd', timer)

    timer = getTimer()
    
    // set the current time
    let date = new Date()
    let hours = date.getHours(), minutes = date.getMinutes()
    
    timer.children[0].value = hours > 12 ? hours - 12 : hours
    timer.children[1].value = minutes
    timer.children[2].value = hours > 12 ? 1 : 0
    
    // add the hooks
    slice.call(timer.children).forEach((item) => {
      item.addEventListener('change', didChange, false)
    })
    
    if(evt.target.dataset.onchange)
       timer.dataset.onchange = evt.target.dataset.onchange
    
    // position the calendar near the origin point
    let timerRect = timer.getBoundingClientRect()
    
    // the width before showing = actual width * 0.25 
    let width = timerRect.width * 4

    timer.style.left = (center.x - width/2) + 'px'
    timer.style.top = (center.y + 16) + 'px'

    timer.classList.add('active')
    
    setTimeout(() => {
      // this needs to be added a second later to prevent ghost click
      document.body.addEventListener('click', bodyClick, false)
    }, 500)

    return false
    
  }

  let triggers = slice.call(document.querySelectorAll('.timer-trigger'))
  
  triggers.forEach((item) => {
    item.addEventListener('click', triggerClick, false)
  })
  
})()
