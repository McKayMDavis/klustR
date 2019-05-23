#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
parallelcoords <- function(data, clusters, width = NULL, height = NULL, elementId = NULL) {

  data <- data.frame(data, clusters)

  # This little guy just orders the clusters so that the legend in the graphic is ordered
  data <- data[order(clusters),]

  # Convert data to json
  data_json <- jsonlite::toJSON(x = data, dataframe = "rows")

  # forward options using x
  x = list(
    data = data_json
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'parallelcoords',
    x,
    width = width,
    height = height,
    package = 'klustR',
    elementId = elementId
  )
}

#' Shiny bindings for klustR
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
#' @name parallelcoords-shiny
#'
#' @export
parallelcoordsOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'parallelcoords', width, height, package = 'klustR')
}

#' @rdname parallelcoords-shiny
#' @export
renderParallelcoords <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, parallelcoordsOutput, env, quoted = TRUE)
}
