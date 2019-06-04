#' Parallel Coordinates Plot for Clustering
#'
#' Creates an interactive parallel coordinates plot detailing each
#' dimension and the cluster associated with each observation.
#'
#' @param data A dataframe of numeric columns.
#'
#' @param clusters A named integer matrix of clusters where names are the row names
#' of the above dataframe and integers are the integer value of the row's associated cluster.
#' This can be obtained from a function such as \code{ stats::kmeans()$cluster }.
#'
#' @param colorScheme The color scheme of the plot. May be a preconfigured D3 ordinal color scheme
#' or a vector of html colors (hex or named) of the same length as the number of clusters.
#'
#' @param labelSizes A number or list of any combination of parameters shown:
#' \code{ list(yaxis = 12, yticks = 10, tooltip = 15) }.
#'
#' @details
#' \itemize{
#'   \item Hover over lines to display row label
#'   \item Click on a line to fade out all lines except the associated cluster
#'   \item Click on another line to bold this line as well
#'   \item Clicking a second time on a line will fade it out
#' }
#'
#' @examples
#' \dontrun{
#'
#' # Barebones
#' df <- state.x77
#' clus <- kmeans(data_scaled, 5)$cluster
#' pacoplot(data = df, clusters = clus)
#'
#' # With options
#' df <- state.x77
#' clus <- kmeans(data_scaled, 5)$cluster
#' pacoplot(data = df, clusters = clus,
#'          colorScheme = c("red", "green", "orange", "blue", "yellow"),
#'          labelSizes = list(yaxis = 16, yticks = 12))
#'
#' }
#'
#' @import htmlwidgets
#'
#' @export
pacoplot <- function(data,
                     clusters,
                     colorScheme = "schemeCategory10",
                     width = NULL,
                     height = NULL,
                     labelSizes = NULL) {
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
  data <- data.frame(data, clusters)

  av_data <- aggregate(. ~ clusters, data, mean)

  q1_data <- aggregate(. ~ clusters, data, function(x){return(quantile(x, c(0.25)))})
  q1_data <- reshape(q1_data,
                     varying = list(2:ncol(q1_data)),
                     v.names = "quartile",
                     timevar = "dimensions",
                     times = colnames(q1_data)[2:ncol(q1_data)],
                     direction = "long")[,-4]

  q3_data <- aggregate(. ~ clusters, data, function(x){return(quantile(x, c(0.75)))})
  q3_data <- reshape(q3_data,
                     varying = list(2:ncol(q3_data)),
                     v.names = "quartile",
                     timevar = "dimensions",
                     times = colnames(q3_data)[2:ncol(q3_data)],
                     direction = "long")[,-4]

  q_data <- rbind(q1_data, q3_data)

  if (typeof(labelSizes) == "double") {
    labelSizes <- list(yaxis = labelSizes,
                       yticks = labelSizes,
                       tooltip = labelSizes)
  }

  # This little guy just orders the clusters so that the legend in the graphic is ordered
  data <- data[order(clusters),]

  # Convert to json
  data_json <- jsonlite::toJSON(x = data, dataframe = "rows")
  json_av_data <- jsonlite::toJSON(x = av_data, dataframe = "rows")
  json_q_data <- jsonlite::toJSON(x = q_data, dataframe = "rows")
  json_colorScheme <- jsonlite::toJSON(x = colorScheme)
  json_labelSizes <- jsonlite::toJSON(labelSizes)

  # forward options using x
  x = list(
    data = data_json,
    avData = json_av_data,
    qData = json_q_data,
    colorScheme = json_colorScheme,
    labelSizes = json_labelSizes
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'pacoplot',
    x,
    width = width,
    height = height,
    package = 'klustR'
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
#' @name pacoplot-shiny
#'
#' @export
pacoplotOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'pacoplot', width, height, package = 'klustR')
}

#' @rdname pacoplot-shiny
#' @export
renderpacoplot <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, pacoplotOutput, env, quoted = TRUE)
}