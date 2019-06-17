# Dynamic D3.js Based K-Means Clustering Vizualizations in R

This package provides methods for dynamically visualizing k-means clustering data or any ordinal data and its associated clusters, though the original intention was to provide users with a more user friendly visualization tool for k-means clustering.

Development Version: 0.1.0
<!-- badges: start -->
[![Travis build status](https://travis-ci.org/McKayMDavis/klustR.svg?branch=master)](https://travis-ci.org/McKayMDavis/klustR)
<!-- badges: end -->

## Installation

Use requires package `htmlwidgets`.

```R
library(devtools)
install_github("ramnathv/htmlwidgets")
install_github("McKayMDavis/klustR")
```

## Basic Usage

#### `pcplot`, a dynamic visualization of dimensionally reduced data:

```R
scaled_df <- scale(state.x77)
clus <- kmeans(data_scaled, 5)$cluster
pcplot(data = data_scaled, clusters = clus)
```

Things to note:

* Clicking on an axis label will display a bar-chart of each column's contribution percentage to that particular dimension or principal component

* Hovering over points displays the label

* Clicking on a color on the legend highlights the associated cluster

#### `pacoplot`, a dynamic parallel coordinates plot:

```R
df <- state.x77
clus <- kmeans(data_scaled, 5)$cluster
pacoplot(data = df, clusters = clus)
```

Things to note:

* Hovering over a line displays the label

* Clicking on a line highlights the associated cluster

* Clicking on the "Toggle Averages" box displays median lines and 1st and 3rd quartile intervals for each cluster


Visit [website](https://mckaymdavis.github.io/klustR/) for more details.
