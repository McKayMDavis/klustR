#' Principal Component Plot for K-Means Clustering
#'
#' Reduces dimensionality to 2D using principal component analysis (PCA)
#' and displays a dynamic visualization of two principal components (PC).
#'
#' @param data A dataframe of numeric columns.
#' Scaled data is preferred as PCA does not work the same with non-scaled data.
#'
#' @param clusters A named integer matrix of clusters where names are the row names
#' of the above dataframe and integers are the integer value of the row's associated cluster.
#' This can be obtained from a function such as \code{ stats::kmeans()$cluster }.
#'
#' @param barColor The color to use for the bar-chart fill. May be any html color (hex or named).
#'
#' @param colorScheme The color scheme of the PCA plot. May be a pre-configured D3 ordinal color scheme
#' or a vector of html colors (hex or named) of the same length as the number of clusters.
#'
#' @param width The width of the plot window.
#'
#' @param height The height of the plot window.
#'
#' @param labelSizes A number or list of any combination of parameters shown that define the label sizes. \cr
#' \code{ list(yaxis = 12, yticks = 10, tooltip = 15) }
#'
#' @param dotSize A number to adjust the size of the dots.
#'
#' @param pcGridlines \code{ TRUE } \code{ FALSE } Show grid-lines on the PC plots?
#'
#' @param barGridlines \code{ TRUE } \code{ FALSE } Show grid-lines on the bar-charts?
#'
#' @details
#' \itemize{
#'   \item Clicking on axis labels will display a bar-chart of PC contribution
#'   \item Clicking on legend colors will fade out all points but the points in the cluster selected
#'   \item Hover over points to see the label and point coordinates
#' }
#'
#' @examples
#'
#' # Barebones
#' scaled_df <- scale(state.x77)
#' clus <- kmeans(data_scaled, 5)$cluster
#' pcplot(data = data_scaled, clusters = clus)
#'
#' # With Options
#' scaled_df <- scale(state.x77)
#' clus <- kmeans(data_scaled, 5)$cluster
#' pcplot(data = data_scaled, clusters = clus,
#'        barColor = "red",
#'        colorScheme = c("red", "green", "orange", "blue", "yellow"),
#'        labelSizes = list(yaxis = 20, yticks = 15, tooltip = 25),
#'        pcGridlines = T, barGridlines = T)
#'
#'
#' @import htmlwidgets
#' @import stats
#'
#' @export
pcplot <- function(data,
                   clusters,
                   barColor = "steelblue",
                   colorScheme = "schemeCategory10",
                   width = NULL,
                   height = NULL,
                   labelSizes = NULL,
                   dotSize = NULL,
                   pcGridlines = FALSE,
                   barGridlines = FALSE) {

  # Parameter checks
  if (typeof(colorScheme) != "character" && typeof(colorScheme) != "list") {
    stop("colorScheme must be of type character or a list of colors")
  }
  if (!is.null(labelSizes) &&
      typeof(labelSizes) != "list" &&
      typeof(labelSizes) != "double") {
    stop("labelSizes must be of type double or a list of arguments")
  }


  # Data parsing
  PC <- getPC(data, clusters)

  if (typeof(labelSizes) == "double") {
    labelSizes <- list(yaxis = labelSizes,
                       xaxis = labelSizes,
                       yticks = labelSizes,
                       xticks = labelSizes,
                       legend = labelSizes,
                       tooltip = labelSizes,
                       title = labelSizes)
  }

  # This little guy just orders the clusters so that the legend in the graphic is ordered
  PC$PC <- PC$PC[order(clusters),]

  # Convert data to json
  json_PC <- jsonlite::toJSON(x = PC$PC, dataframe = "rows")
  json_PVE <- jsonlite::toJSON(x = PC$PVE)
  json_idx <- jsonlite::toJSON(x = PC$idxs)
  json_cont <- jsonlite::toJSON(x = PC$cont, dataframe = "rows")
  json_thresh <- jsonlite::toJSON(x = PC$thresh)
  json_colorScheme <- jsonlite::toJSON(x = colorScheme)
  json_labelSizes <- jsonlite::toJSON(x = labelSizes)


  # forward options using x
  x = list(
    PC = json_PC,
    PVE = json_PVE,
    idxs = json_idx,
    cont = json_cont,
    thresh = json_thresh,
    barColor = barColor,
    colorScheme = json_colorScheme,
    labelSizes = json_labelSizes,
    dotSize = dotSize,
    pcGridlines = pcGridlines,
    barGridlines = barGridlines
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'pcplot',
    x,
    width = width,
    height = height,
    package = 'klustR',
    sizingPolicy = htmlwidgets::sizingPolicy(
      viewer.padding = 0,
      browser.fill = TRUE
    )
  )
}

#' @rdname klustR-shiny
#' @export
pcplotOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'pcplot', width, height, package = 'klustR')
}

#' @rdname klustR-shiny
#' @export
renderpcplot <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, pcplotOutput, env, quoted = TRUE)
}
