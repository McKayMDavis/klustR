#' Principal Component Plot for K-Means Clustering
#'
#' The function reduces dimensionality to 2D using principal component analysis (PCA)
#' and displays a dynamic visualization of two principal components (PC).
#'
#' @param data A dataframe of numeric columns.
#' Scaled data is preferred as PCA does not work the same with non-scaled data.
#'
#' @param clusters A named integer matrix of clusters where names are the row names
#' of the dataframe and integers are the integer value of the row's associated cluster.
#' This can be obtained from a function such as \code{ stats::kmeans()$clusters }.
#'
#' @param barColor The color to use for the bar-chart fill. May be any html color (hex or named).
#'
#' @param colorScheme The color scheme of the PCA plot. May be a preconfigured D3 ordinal color scheme
#' or a vector of html colors (hex or named).
#'
#' @details
#' \itemize{
#'   \item Clicking on axis labels will display a bar-chart of PC contribution
#'   \item Clicking on legend colors will fade out all points but the points in the cluster selected
#'   \item Hover over points to see the label and point coordinates
#' }
#'
#' @examples
#' \dontrun{
#'
#' scaled_df <- scale(state.x77)
#' clus <- kmeans(data_scaled, 5)$cluster
#' pcplot(data = data_scaled, clusters = clus)
#'
#' }
#'
#' @import htmlwidgets
#'
#' @export
pcplot <- function(data, clusters, barColor = "steelblue", colorScheme = "schemeCategory10", width = NULL, height = NULL) {

  PC <- getPC(data, clusters)

  # This little guy just orders the clusters so that the legend in the graphic is ordered
  PC$PC <- PC$PC[order(clusters),]

  # Convert data to json
  json_PC <- jsonlite::toJSON(x = PC$PC, dataframe = "rows")
  json_PVE <- jsonlite::toJSON(x = PC$PVE)
  json_idx <- jsonlite::toJSON(x = PC$idxs)
  json_cont <- jsonlite::toJSON(x = PC$cont, dataframe = "rows")
  json_thresh <- jsonlite::toJSON(x = PC$thresh)
  json_colorScheme <- jsonlite::toJSON(x = colorScheme)


  # forward options using x
  x = list(
    PC = json_PC,
    PVE = json_PVE,
    idxs = json_idx,
    cont = json_cont,
    thresh = json_thresh,
    barColor = barColor,
    colorScheme = json_colorScheme
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

#' Shiny bindings for pcplot
#'
#' Output and render functions for using klustR within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a klustR
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name pcplot-shiny
#'
#' @export
pcplotOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'pcplot', width, height, package = 'klustR')
}

#' @rdname pcplot-shiny
#' @export
renderPcplot <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, pcplotOutput, env, quoted = TRUE)
}