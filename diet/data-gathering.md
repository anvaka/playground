This is just a collection of discovered URLs that could be used to fetch data from diet-related websites,
that I used to track my progress.


To fetch daily meals from eatthismuch.com: 

```
https://www.eatthismuch.com/api/v1/calendar/?date__in=2020-09-12%2C2020-09-13%2C2020-09-14%2C2020-09-15%2C2020-09-16%2C2020-09-17%2C2020-09-18%2C2020-09-19%2C2020-09-20%2C2020-09-21%2C2020-09-22%2C2020-09-23%2C2020-09-24%2C2020-09-25%2C2020-09-26%2C2020-09-27%2C2020-09-28%2C2020-09-29%2C2020-09-30%2C2020-10-01%2C2020-10-02%2C2020-10-03%2C2020-10-04%2C2020-10-05%2C2020-10-06%2C2020-10-07%2C2020-10-08%2C2020-10-09%2C2020-10-10%2C2020-10-11%2C2020-10-12
```

Then fetch all meals with jq:

```
// all meals
jq '.objects | .[].diet.meals'

// all dates
jq '.objects| .[].date'

// all calories
jq '.objects| .[].diet.meals | .[].foods | .[].food.serving_calories'
```

### Garmin running

This will get running activities, haven't figured out yet how to translate avgSpeed to minutes per mile:

```
https://connect.garmin.com/modern/proxy/fitnessstats-service/activity?aggregation=daily&userFirstDay=sunday&startDate=2020-01-22&endDate=2020-12-17&groupByActivityType=false&activityType=running&metric=avgSpeed&metric=distance&metric=duration&_=1608255027190
```