% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/pcplot.R
\name{pcplot}
\alias{pcplot}
\title{Principal Component Plot for K-Means Clustering}
\usage{
pcplot(data, clusters, barColor = "steelblue",
  colorScheme = "schemeCategory10", width = NULL, height = NULL)
}
\arguments{
\item{data}{A dataframe of numeric columns.
Scaled data is preferred as PCA does not work the same with non-scaled data.}

\item{clusters}{A named integer matrix of clusters where names are the row names
of the dataframe and integers are the integer value of the row's associated cluster.
This can be obtained from a function such as \code{ stats::kmeans()$clusters }.}

\item{barColor}{The color to use for the bar-chart fill. May be any html color (hex or named).}

\item{colorScheme}{The color scheme of the PCA plot. May be a preconfigured D3 ordinal color scheme
or a vector of html colors (hex or named).}
}
\description{
The function reduces dimensionality to 2D using principal component analysis (PCA)
and displays a dynamic visualization of two principal components (PC).
}
\details{
\itemize{
  \item Clicking on axis labels will display a bar-chart of PC contribution
  \item Clicking on legend colors will fade out all points but the points in the cluster selected
  \item Hover over points to see the label and point coordinates
}
}
\examples{
\dontrun{

scaled_df <- scale(state.x77)
clus <- kmeans(data_scaled, 5)$cluster
pcplot(data = data_scaled, clusters = clus)

}

}